import { useEffect } from "react";

const getVisibleCardCount = (viewportWidth) => {
  if (viewportWidth > 1280) return 4;
  if (viewportWidth > 1080) return 3;
  if (viewportWidth > 600) return 2;
  return 1;
};

export default function useProjectCarousel(contentKey) {
  useEffect(() => {
    if (!contentKey) return undefined;

    const carousel = document.querySelector("[data-target='carousel']");
    const previousButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");

    if (!carousel || !previousButton || !nextButton) return undefined;

    const cards = Array.from(carousel.querySelectorAll("[data-target='card']"));
    let currentPage = 0;
    let maximumPage = 0;
    let pageWidth = 0;
    let resizeTimer;

    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.setAttribute("aria-label", "이전 프로젝트 보기");
    nextButton.setAttribute("aria-label", "다음 프로젝트 보기");

    const updateButtons = () => {
      const isFirstPage = currentPage === 0;
      const isLastPage = currentPage >= maximumPage;

      previousButton.classList.toggle("no", isFirstPage);
      nextButton.classList.toggle("no", isLastPage);
      previousButton.disabled = isFirstPage;
      nextButton.disabled = isLastPage;
    };

    const moveCarousel = () => {
      carousel.style.marginLeft = `${-(currentPage * pageWidth)}px`;
      updateButtons();
    };

    const measureCarousel = () => {
      const visibleCardCount = Math.min(
        getVisibleCardCount(window.innerWidth),
        cards.length,
      );
      const cardWidth = cards[0]?.getBoundingClientRect().width ?? 0;

      pageWidth = cardWidth * visibleCardCount;
      maximumPage = Math.max(0, Math.ceil(cards.length / visibleCardCount) - 1);
      currentPage = Math.min(currentPage, maximumPage);
      moveCarousel();
    };

    const showPreviousPage = () => {
      currentPage = Math.max(0, currentPage - 1);
      moveCarousel();
    };

    const showNextPage = () => {
      currentPage = Math.min(maximumPage, currentPage + 1);
      moveCarousel();
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measureCarousel, 150);
    };

    previousButton.addEventListener("click", showPreviousPage);
    nextButton.addEventListener("click", showNextPage);
    window.addEventListener("resize", handleResize);
    measureCarousel();

    return () => {
      window.clearTimeout(resizeTimer);
      previousButton.removeEventListener("click", showPreviousPage);
      nextButton.removeEventListener("click", showNextPage);
      window.removeEventListener("resize", handleResize);
      carousel.style.marginLeft = "";
    };
  }, [contentKey]);
}
