import PropTypes from 'prop-types';
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useHistory } from 'react-router-dom';
import { getScrollbarWidth } from '../../helper';
import { useSelector } from 'react-redux';

const Modal = ({
  open,
  onClose,
  noEscapeClose = false,
  noOuterClickClose = false,
  children,
  onKeyDown,
}) => {
  const history = useHistory();
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);
  // const isMobile = useIsMobile();
  // useLayoutEffect(() => {
  //   if (open) {
  //     if (isMobile) history.push(history.location);
  //     const unlisten = history.listen((location, action) => {
  //       if (action === 'POP') {
  //         onClose();
  //       }
  //     })
  //     return () => {
  //       unlisten();
  //     }
  //   }
  // }, [open])

  // Get the focused element before opening the modal.
  const lastFocusedBeforeModal = useSelector((state) => state.main.lastFocusedBeforeModal);
  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement;
      if (modalRef.current && modalRef.current.contains(previouslyFocusedElement.current)) {
        previouslyFocusedElement.current = lastFocusedBeforeModal;
      }
    }
  }, [open, lastFocusedBeforeModal]);

  // Restore focus when closed.
  useEffect(() => {
    return () => {
      if (
        previouslyFocusedElement.current &&
        typeof previouslyFocusedElement.current.focus === 'function'
      ) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const unlisten = history.listen((location, action) => {
        if (action === 'POP') onClose();
      });
      return () => unlisten();
    }
  }, [open]);

  const [el] = useState(document.createElement('el'));
  useEffect(() => {
    document.getElementById('modal-root').appendChild(el);
    return () => {
      document.getElementById('modal-root').removeChild(el);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!noEscapeClose && e.key === 'Escape') onClose();

    // Focus trap.
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  };
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);

      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0].focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open]);

  useLayoutEffect(() => {
    const width = getScrollbarWidth();
    const navbarEl = document.querySelector('.navbar');
    if (open) {
      document.body.classList.add('is-clipped');
      // Scrollbar always visible now
      // if (isScrollbarVisible()) {
      document.body.style.paddingRight = `${width}px`;
      if (navbarEl) {
        navbarEl.style.paddingRight = `${width}px`;
      }
      // }
    }
    return () => {
      if (open) {
        document.body.classList.remove('is-clipped');
        document.body.style.paddingRight = '0';
        if (navbarEl) {
          navbarEl.style.paddingRight = `0`;
        }
      }
    };
  });

  const handleBgClick = (e) => {
    if (!noOuterClickClose && e.target.classList.contains('modal-bg')) {
      onClose();
    }
  };

  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="modal" onClick={handleBgClick}>
      <div className="modal-container">
        <div className="modal-modal" ref={modalRef} tabIndex="-1">
          {children}
        </div>
        <div className="modal-bg"></div>
      </div>
    </div>,
    el
  );
};

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  noEscapeClose: PropTypes.bool,
  noOuterClickClose: PropTypes.bool,
  children: PropTypes.element.isRequired,
  onKeyDown: PropTypes.func,
};

export default Modal;
