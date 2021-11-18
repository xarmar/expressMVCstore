// Expand menu when user clickS burger menu
const navbarMenu = document.querySelector("#navbar-menu");
const navbarBurger = document.querySelector(".navbar--burger");
navbarBurger.addEventListener("click", () => {
  let visibleMenu = navbarMenu.getAttribute("data-visible");
  if(visibleMenu === "false") {
    navbarMenu.setAttribute("data-visible", true);
    navbarBurger.setAttribute("aria-expanded", "true");
  }
  else {
    navbarMenu.setAttribute("data-visible", false);
    navbarBurger.setAttribute("aria-expanded", "false");
  }
});

// Check if an element is part of the menu
const navBar = document.querySelector("#navbar");
const isMenu = (e) => {
  let target = e.target;
  while(target.parentNode) {
    if(target.parentNode === navBar) {
      return true;
    }
    else {
      target = target.parentNode;
    }
  }
  return false
}

// Collapse expanded menu when user clicks outside it
window.addEventListener('click', function(e) {
  let visibleMenu = navbarMenu.getAttribute("data-visible");
  if(!isMenu(e) && visibleMenu === "true") {
      navbarMenu.setAttribute("data-visible", false);
      navbarBurger.setAttribute("aria-expanded", "false");
  }
});