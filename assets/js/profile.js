/* ==========================================================================
   kyokagong.github.io — Profile Lightbox & Subtle Interactions
   Zero-dependency vanilla JS for inspecting hardware & demo figures.
   ========================================================================== */
(function () {
  'use strict';

  function initLightbox() {
    var triggers = document.querySelectorAll('[data-lightbox-src]');
    if (!triggers.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '图片预览');
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="关闭预览">&times;</button>' +
      '<div class="lightbox-dialog">' +
      '  <img class="lightbox-img" src="" alt="">' +
      '  <div class="lightbox-caption"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    var imgEl = overlay.querySelector('.lightbox-img');
    var capEl = overlay.querySelector('.lightbox-caption');
    var closeBtn = overlay.querySelector('.lightbox-close');

    function openLightbox(src, alt, caption) {
      imgEl.src = src;
      imgEl.alt = alt || '';
      capEl.textContent = caption || alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-lightbox-src');
        var caption = btn.getAttribute('data-lightbox-caption') || '';
        var thumb = btn.querySelector('img');
        var alt = thumb ? thumb.getAttribute('alt') : '';
        if (src) openLightbox(src, alt, caption);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initLightbox);
})();
