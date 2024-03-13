document.addEventListener("DOMContentLoaded", () => {
    const submitBook = document.getElementById("input-form");
    submitBook.addEventListener("submit", (event) => {
        event.preventDefault();
        showAddBookToast();
        addBook();
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    }
});

function showAddBookToast() {
    const toast = document.getElementById("addBookToast");
    toast.className = "show";
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

const books = [];
const RENDER_EVENT = "render-book";

function addBook() {
    const bookTitle = document.getElementById("title").value;
    const bookAuthor = document.getElementById("author").value;
    const bookYear = parseInt(document.getElementById("year").value);

    const generatedID = generateId();
    const bookObject = generateBookObject(generatedID, bookTitle, bookAuthor, bookYear, false);
    books.push(bookObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function generateId() {
    return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

document.addEventListener(RENDER_EVENT, () => {
    const notCompletedList = document.getElementById("notCompletedBook");
    notCompletedList.innerHTML = "";

    const completedBookList = document.getElementById("completedBook");
    completedBookList.innerHTML = "";

    for (const bookItem of books) {
        const bookElement = makeBook(bookItem);
        if (!bookItem.isComplete) {
            notCompletedList.append(bookElement);
        } else {
            completedBookList.append(bookElement);
        }
    }
});

function makeBook(bookObject) {
    const bookTitle = document.createElement("h2");
    bookTitle.innerText = bookObject.title;

    const bookAuthor = document.createElement("p");
    bookAuthor.innerText = bookObject.author;

    const bookYear = document.createElement("p");
    bookYear.innerText = bookObject.year;

    const bookContainer = document.createElement("div");
    bookContainer.classList.add("inner");
    bookContainer.append(bookTitle, bookAuthor, bookYear);

    const container = document.createElement("div");
    container.classList.add("item");
    container.append(bookContainer);
    container.setAttribute("id", "book-${bookObject.id}");

    if (bookObject.isComplete) {
        const undoButton = document.createElement("button");
        undoButton.classList.add("undo-button");
        undoButton.innerHTML = "UNDO";

        undoButton.addEventListener("click", () => {
            undoBookFromCompleted(bookObject.id);
        });

        const trashButton = document.createElement("button");
        trashButton.classList.add("trash-button");
        trashButton.innerHTML = "DELETE";

        trashButton.addEventListener("click", () => {
            removeBookFromCompleted(bookObject.id);
        });

        container.append(undoButton, trashButton);
    } else {
        const checkButton = document.createElement("button");
        checkButton.classList.add("check-button");
        checkButton.innerHTML = "COMPLETE";

        checkButton.addEventListener("click", () => {
            addBookToCompleted(bookObject.id);
        });

        const trashButton = document.createElement("button");
        trashButton.classList.add("trash-button");
        trashButton.innerHTML = "DELETE";

        trashButton.addEventListener("click", () => {
            removeBookFromCompleted(bookObject.id);
        });

        container.append(checkButton, trashButton);
    }

    document.getElementById("input-form").reset();

    return container;
}

function addBookToCompleted(bookId) {
    const bookTarget = findBook(bookId);

    if (bookTarget == null) {
        return;
    }

    bookTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findBook(bookId) {
    for (const bookItem of books) {
        if (bookItem.id === bookId) {
            return bookItem;
        }
    }

    return null;
}

function removeBookFromCompleted(bookId) {
    const bookTarget = findBookIndex(bookId);

    if (bookTarget === -1) {
        return;
    }

    books.splice(bookTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function undoBookFromCompleted(bookId) {
    const bookTarget = findBook(bookId);

    if (bookTarget == null) {
        return;
    }

    bookTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findBookIndex(bookId) {
    for (const index in books) {
        if (books[index].id === bookId) {
            return index;
        }
    }

    return -1;
}

function saveData() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

const SAVED_EVENT = "saved-book";
const STORAGE_KEY = "BOOKSHELF_APPS";

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert("Browser doesn't support local storage.");
        return false
    }
    return true;
}

document.addEventListener(SAVED_EVENT, () => {
    console.log(localStorage.getItem(STORAGE_KEY));
});

function loadDataFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const book of data) {
            books.push(book);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

document.getElementById("search-book").addEventListener("keyup", () => {
    searchBook();
});

function displayBookInfo(bookItem) {
    const bookInfoElement = document.createElement("div");
    bookInfoElement.classList.add("book-info");

    const titleElement = document.createElement("h2");
    titleElement.textContent = bookItem.title;
    bookInfoElement.appendChild(titleElement);

    const statusElement = document.createElement("p");
    statusElement.textContent = `${bookItem.isComplete ? 'COMPLETED' : 'NOT COMPLETED'}`;

    if (bookItem.isComplete) {
        statusElement.classList.add("bookInfoCompleted");
    } else {
        statusElement.classList.add("bookInfoNotCompleted");
    }

    bookInfoElement.appendChild(statusElement);

    return bookInfoElement;
}

function searchBook() {
    const searchedBook = [];
    const searchBookTitle = document.getElementById("search-book").value;

    for (const bookItem of books) {
        if (bookItem.title.toLowerCase().includes(searchBookTitle.toLowerCase())) {
            searchedBook.push(bookItem);
        }
    }

    const findBookContainer = document.getElementById("find-book");
    findBookContainer.innerHTML = "";
    
    for (const bookItem of searchedBook) {
        const bookInfoElement = displayBookInfo(bookItem);
        findBookContainer.append(bookInfoElement);
    }

    if (searchedBook.length === 0) {
        const bookInfoElement = document.createElement("div");
        bookInfoElement.classList.add("book-not-found");

        const titleElement = document.createElement("h2");
        titleElement.textContent = "Book Not Found.";
        bookInfoElement.appendChild(titleElement);

        findBookContainer.append(bookInfoElement);
    }

    if (searchBookTitle === "") {
        findBookContainer.innerHTML = "";
    }
}