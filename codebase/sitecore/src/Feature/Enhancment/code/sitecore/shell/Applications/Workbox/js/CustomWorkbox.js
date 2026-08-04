function onShowMoreButton(btn) {
    var hiddenLis = btn.parentNode.querySelectorAll('li.unordered-hidden-item');

    btn.classList.add("hide");
    btn.parentNode.querySelector('.unordered-list-show-less-btn').classList.remove("hide");

    hiddenLis.forEach(element => {
        element.classList.add("show");
    });
}

function onShowLessButton(btn) {
    var hiddenLis = btn.parentNode.querySelectorAll('li.unordered-hidden-item');

    btn.classList.add("hide");
    btn.parentNode.querySelector('.unordered-list-show-more-btn').classList.remove("hide");

    hiddenLis.forEach(element => {
        element.classList.remove("show");
    });
}
