import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Link from '../components/Link';
import { sidebarScrollYUpdated, toggleSidebarOpen } from '../slices/mainSlice';
import {
  SVGCommunities,
  SVGDiscord,
  SVGGithub,
  SVGHome,
  SVGInstagram,
  SVGList,
  SVGSubstack,
  SVGTwitter,
} from '../SVGs';
import WelcomeBanner from '../views/WelcomeBanner';
import { ButtonClose } from './Button';
import CommunityProPic from './CommunityProPic';
import Search from './Navbar/Search';
import { getFocusableElements } from '../helper';
import { MountTransition } from './Transition';

const Sidebar = ({ mobile = false }) => {
  const dispatch = useDispatch();

  const previouslyFocusedElement = useRef(null);
  const user = useSelector((state) => state.main.user);
  const loggedIn = user !== null;

  const homeFeed = loggedIn ? user.homeFeed : 'all';
  const communities = useSelector((state) => state.main.sidebarCommunities);

  const open = useSelector((state) => state.main.sidebarOpen);
  const handleClose = () => {
    if (open) dispatch(toggleSidebarOpen());
  };

  // Focus trap & Escape key
  useEffect(() => {
    if (!open) return;

    const node = ref.current;
    if (!node) return;

    // Save the previously focused element if it's not inside the sidebar.
    if (document.activeElement && !node.contains(document.activeElement)) {
      previouslyFocusedElement.current = document.activeElement;
    }

    const focusable = getFocusableElements(node);
    if (focusable.length === 0) return;

    if (!node.contains(document.activeElement)) {
      focusable[0].focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        dispatch(toggleSidebarOpen());
        return;
      }
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }

    node.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      node.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDown);

      // Restore focus when sidebar closes.
      if (
        previouslyFocusedElement.current &&
        typeof previouslyFocusedElement.current.focus === 'function'
      ) {
        previouslyFocusedElement.current.focus();
        previouslyFocusedElement.current = null;
      }
    };
  }, [open, dispatch]);

  const location = useLocation();
  const homePageLink = (to) => {
    const params = new URLSearchParams(location.search);
    if (params.has('sort')) {
      return `${to}?sort=${params.get('sort')}`;
    }
    return to;
  };

  const expanded = useSelector((state) => state.main.sidebarCommunitiesExpanded);
  const renderCommunitiesList = () => {
    const renderInitially = 10,
      length = communities ? communities.length : 0,
      lengthLeft = length - renderInitially;
    return (
      <>
        {communities
          .filter((_, i) => {
            if (expanded) {
              return true;
            }
            return i < renderInitially;
          })
          .map((c) => (
            <Link
              to={`/${c.name}`}
              key={c.id}
              className="sidebar-item with-image"
              onClick={handleClose}
            >
              <CommunityProPic name={c.name} proPic={c.proPic} className="is-image is-no-hover" />
              <span>{c.name}</span>
            </Link>
          ))}
        {length > 10 && (
          <div
            className="sidebar-item with-image"
            onClick={() => dispatch({ type: 'main/sidebarCommunitiesExpandToggle' })}
          >
            <svg
              style={{
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.9995 16.8006C11.2995 16.8006 10.5995 16.5306 10.0695 16.0006L3.54953 9.48062C3.25953 9.19062 3.25953 8.71062 3.54953 8.42063C3.83953 8.13063 4.31953 8.13063 4.60953 8.42063L11.1295 14.9406C11.6095 15.4206 12.3895 15.4206 12.8695 14.9406L19.3895 8.42063C19.6795 8.13063 20.1595 8.13063 20.4495 8.42063C20.7395 8.71062 20.7395 9.19062 20.4495 9.48062L13.9295 16.0006C13.3995 16.5306 12.6995 16.8006 11.9995 16.8006Z"
                fill="currentColor"
              />
            </svg>
            <span>{expanded ? 'Show less' : `Show ${lengthLeft} more`}</span>
          </div>
        )}
      </>
    );
  };

  const ref = useRef(null);
  const scrollY = useSelector((state) => state.main.sidebarScrollY);
  useLayoutEffect(() => {
    const el = ref.current;
    el.scrollTo(0, scrollY);
    return () => {
      if (el) {
        dispatch(sidebarScrollYUpdated(el.scrollTop));
      }
    };
  }, [dispatch, scrollY]);

  const lists = useSelector((state) => state.main.lists.lists);

  const sidebarWidth = 300;
  const closedXPos = -1 * sidebarWidth - 1; // Sidebar's translateX when it's closed.
  const [position, _setPosition] = useState({ x: open ? 0 : closedXPos, y: 0 });
  const [isDragging, _setIsDragging] = useState(false);
  const touchState = useRef({
    position: { x: position.x, y: position.y },
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    secondPos: { x: 0, y: 0 },
    isDragging: false,
    open: open,
    mouseMovements: 0,
  });
  const setPosition = (pos) => {
    touchState.current = {
      ...touchState.current,
      position: pos,
    };
    _setPosition(pos);
  };
  useEffect(() => {
    let pos = { x: 0, y: 0 };
    if (!open) {
      pos = { x: closedXPos, y: 0 };
    }
    touchState.current = {
      ...touchState.current,
      position: pos,
      open,
    };
    _setPosition(pos);
  }, [open, closedXPos]);

  useEffect(() => {
    const setOffset = (offset) => {
      touchState.current = {
        ...touchState.current,
        offset: offset,
      };
    };
    const setIsDragging = (is) => {
      touchState.current = {
        ...touchState.current,
        isDragging: is,
      };
      _setIsDragging(is);
    };
    const touchMove = (event) => {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      let x = clientX - touchState.current.offset.x;
      let y = clientY - touchState.current.offset.y;
      if (x > 0) {
        x = 0;
      }
      if (!touchState.current.open && touchState.current.startPos.x > 100) {
        return;
      }
      if (touchState.current.mouseMovements === 0) {
        touchState.current = {
          ...touchState.current,
          secondPos: { x: clientX, y: clientY },
        };
      }
      touchState.current.mouseMovements++;
      if (
        touchState.current.open &&
        angleBetweenPoints(touchState.current.startPos, touchState.current.secondPos) > 0.5
      ) {
        return;
      }
      setIsDragging(true);
      setPosition({ x, y });
    };
    const touchStart = (event) => {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      setOffset({
        x: clientX - touchState.current.position.x,
        y: clientY - touchState.current.position.y,
      });
      touchState.current = {
        ...touchState.current,
        startPos: { x: clientX, y: clientY },
        secondPos: { x: clientX, y: clientY },
        mouseMovements: 0,
      };
      document.addEventListener('mousemove', touchMove);
      document.addEventListener('mouseup', touchEnd);
      document.addEventListener('touchmove', touchMove);
      document.addEventListener('touchend', touchEnd);
    };
    const touchEnd = () => {
      const posX = touchState.current.position.x;
      if (touchState.current.open) {
        if (posX < -50) {
          dispatch(toggleSidebarOpen());
          setPosition({ x: closedXPos, y: 0 });
        } else {
          setPosition({ x: 0, y: 0 });
        }
      } else {
        if (posX > closedXPos + 50) {
          dispatch(toggleSidebarOpen());
          setPosition({ x: 0, y: 0 });
        } else {
          setPosition({ x: closedXPos, y: 0 });
        }
      }
      setIsDragging(false);
      document.removeEventListener('mousemove', touchMove);
      document.removeEventListener('mouseup', touchEnd);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    };
    document.addEventListener('mousedown', touchStart);
    document.addEventListener('touchstart', touchStart);
    return () => {
      document.removeEventListener('mousedown', touchStart);
      document.removeEventListener('touchstart', touchStart);
    };
  }, [dispatch, closedXPos]);

  const overlayVisible = position.x > closedXPos;
  useEffect(() => {
    if (mobile && overlayVisible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [overlayVisible, mobile]);

  return (
    <>
      {mobile && (
        <MountTransition
          className="body-overlay"
          display={overlayVisible}
          onClick={() => dispatch(toggleSidebarOpen())}
          visibleStyle={{ opacity: position.x === 0 ? 1 : 1 - Math.abs(position.x) / sidebarWidth }}
          hiddenStyle={{ opacity: 0 }}
        />
      )}
      <aside
        ref={ref}
        className={clsx('sidebar sidebar-left is-custom-scrollbar is-v2', mobile && ' is-mobile')}
        style={{
          display: mobile ? 'flex' : undefined,
          width: mobile ? `${sidebarWidth}px` : undefined,
          cursor: mobile ? (isDragging ? 'grabbing' : 'grab') : undefined,
          userSelect: mobile ? 'none' : undefined,
          touchAction: mobile ? 'none' : undefined,
          transform: mobile ? `translateX(${position.x}px)` : undefined,
          visibility: mobile ? (!overlayVisible ? 'hidden' : 'visible') : undefined,
          transition: mobile ? (isDragging ? 'none' : undefined) : undefined,
        }}
      >
        <div className="sidebar-top-m">
          <h2>{import.meta.env.VITE_SITENAME}</h2>
          <ButtonClose onClick={() => dispatch(toggleSidebarOpen())} />
        </div>
        <div
          className="sidebar-content"
          style={{
            overflowY: isDragging ? 'hidden' : undefined,
            scrollbarWidth: mobile ? 'none' : undefined,
          }}
        >
          <nav className="sidebar-list">
            {mobile && (
              <div className="sidebar-item is-search">
                <Search />
              </div>
            )}
            <Link to={homePageLink('/')} className="sidebar-item with-image" onClick={handleClose}>
              <SVGHome />
              <span>Home</span>
            </Link>
            {loggedIn && (
              <Link
                to={homePageLink(`/${homeFeed === 'all' ? 'subscriptions' : 'all'}`)}
                className="sidebar-item with-image"
                onClick={handleClose}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.97"
                    d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM8.31 16.31C7.59 16.31 7 15.72 7 15C7 14.28 7.59 13.69 8.31 13.69C9.03 13.69 9.62 14.28 9.62 15C9.62 15.72 9.03 16.31 8.31 16.31ZM12 10.31C11.28 10.31 10.69 9.72 10.69 9C10.69 8.28 11.28 7.69 12 7.69C12.72 7.69 13.31 8.28 13.31 9C13.31 9.72 12.72 10.31 12 10.31ZM15.69 16.31C14.97 16.31 14.38 15.72 14.38 15C14.38 14.28 14.97 13.69 15.69 13.69C16.41 13.69 17 14.28 17 15C17 15.72 16.41 16.31 15.69 16.31Z"
                    fill="currentColor"
                  />
                </svg>
                <span>{homeFeed === 'all' ? 'Subscriptions' : 'All'}</span>
              </Link>
            )}
            <Link to="/communities" className="sidebar-item with-image" onClick={handleClose}>
              <SVGCommunities />
              <span>Communities</span>
            </Link>
            <Link to="/guidelines" className="sidebar-item with-image" onClick={handleClose}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.5408 4.11984L13.0408 2.05984C12.4708 1.84984 11.5408 1.84984 10.9708 2.05984L5.47078 4.11984C4.41078 4.51984 3.55078 5.75984 3.55078 6.88984V14.9898C3.55078 15.7998 4.08078 16.8698 4.73078 17.3498L10.2308 21.4598C11.2008 22.1898 12.7908 22.1898 13.7608 21.4598L19.2608 17.3498C19.9108 16.8598 20.4408 15.7998 20.4408 14.9898V6.88984C20.4508 5.75984 19.5908 4.51984 18.5408 4.11984ZM15.4808 9.71984L11.1808 14.0198C11.0308 14.1698 10.8408 14.2398 10.6508 14.2398C10.4608 14.2398 10.2708 14.1698 10.1208 14.0198L8.52078 12.3998C8.23078 12.1098 8.23078 11.6298 8.52078 11.3398C8.81078 11.0498 9.29078 11.0498 9.58078 11.3398L10.6608 12.4198L14.4308 8.64984C14.7208 8.35984 15.2008 8.35984 15.4908 8.64984C15.7808 8.93984 15.7808 9.42984 15.4808 9.71984Z"
                  fill="currentColor"
                />
              </svg>
              <span>Guidelines</span>
            </Link>
            <Link to="/terms" className="sidebar-item with-image is-m" onClick={handleClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="currentColor"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M14.59 2.59c-.38-.38-.89-.59-1.42-.59H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.41l-4.82-4.83zM15 18H9c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H9c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1zm-2-6V3.5L18.5 9H14c-.55 0-1-.45-1-1z" />
              </svg>
              <span>Terms</span>
            </Link>
            <Link
              to="/privacy-policy"
              className="sidebar-item with-image is-m"
              onClick={handleClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="currentColor"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V18c0 .55.45 1 1 1h9c.55 0 1-.45 1-1v-1.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V18c0 .55.45 1 1 1h6v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z" />
              </svg>
              <span>Privacy</span>
            </Link>
            <a
              href={`mailto:${import.meta.env.VITE_EMAILCONTACT}`}
              className="sidebar-item with-image is-m"
              onClick={handleClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="currentColor"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 4.25l-7.07 4.42c-.32.2-.74.2-1.06 0L4.4 8.25c-.25-.16-.4-.43-.4-.72 0-.67.73-1.07 1.3-.72L12 11l6.7-4.19c.57-.35 1.3.05 1.3.72 0 .29-.15.56-.4.72z" />
              </svg>
              <span>Contact</span>
            </a>
            <Link to="/about" className="sidebar-item with-image is-m" onClick={handleClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="currentColor"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.23 15.39L12 15.45l-3.22 1.94c-.38.23-.85-.11-.75-.54l.85-3.66-2.83-2.45c-.33-.29-.15-.84.29-.88l3.74-.32 1.46-3.45c.17-.41.75-.41.92 0l1.46 3.44 3.74.32c.44.04.62.59.28.88l-2.83 2.45.85 3.67c.1.43-.36.77-.74.54z" />
              </svg>
              <span>About</span>
            </Link>
            {loggedIn && lists.length > 0 && (
              <>
                <div className="sidebar-topic">My Lists</div>
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    className="sidebar-item with-image"
                    to={`/@${user.username}/lists/${list.name}`}
                  >
                    <SVGList />
                    <span>{list.displayName}</span>
                  </Link>
                ))}
              </>
            )}
            <div className="sidebar-topic">{loggedIn ? 'My communities' : 'Communities'}</div>
            {renderCommunitiesList()}
            <div className="social-links">
              {import.meta.env.VITE_FACEBOOKURL && (
                <a
                  href={import.meta.env.VITE_FACEBOOKURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
                    ></path>
                  </svg>
                </a>
              )}
              {import.meta.env.VITE_TWITTERURL && (
                <a
                  href={import.meta.env.VITE_TWITTERURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="Twitter"
                >
                  <SVGTwitter />
                </a>
              )}
              {import.meta.env.VITE_INSTAGRAMURL && (
                <a
                  href={import.meta.env.VITE_INSTAGRAMURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="Instagram"
                >
                  <SVGInstagram />
                </a>
              )}
              {import.meta.env.VITE_DISCORDURL && (
                <a
                  href={import.meta.env.VITE_DISCORDURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="Discord"
                >
                  <SVGDiscord />
                </a>
              )}
              {import.meta.env.VITE_GITHUBURL && (
                <a
                  href={import.meta.env.VITE_GITHUBURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="GitHub"
                >
                  <SVGGithub />
                </a>
              )}
              {import.meta.env.VITE_SUBSTACKURL && (
                <a
                  href={import.meta.env.VITE_SUBSTACKURL}
                  target="_blank"
                  rel="noreferrer"
                  className="button social-link"
                  aria-label="Substack"
                >
                  <SVGSubstack />
                </a>
              )}
            </div>
          </nav>
          <WelcomeBanner className="is-m" hideIfMember />
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  mobile: PropTypes.bool,
};

export default Sidebar;

function angleBetweenPoints(p1, p2) {
  const { x: x0, y: y0 } = p1;
  const { x: x1, y: y1 } = p2;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const h = Math.sqrt(dx * dx + dy * dy);
  return Math.abs(Math.asin((y1 - y0) / h));
}
