import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, deleteDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection reference
const colRef = collection(db, "thelist");

// HTML elements
const form = document.querySelector("#addForm");
const inputTitle = document.querySelector("#title");
const inputDescription = document.querySelector("#description");
const listContainer = document.querySelector("#listContainer");
const tagContainer = document.querySelector("#tagContainer");
const tagButtons = tagContainer.querySelectorAll("button");
const tagDisplay = document.querySelector("#tagDisplay");
let selectedTag = ''; // Default to empty, meaning "no tag"

// Function to update tag display
const updateTagDisplay = (tag) => {
    tagDisplay.className = tag === '' ? 'selected-tag no-tag' : `selected-tag ${tag}`;
};

// Set up event listeners for tag buttons
tagButtons.forEach(button => {
    button.addEventListener('click', () => {
        const clickedTag = button.getAttribute('data-tag');

        // Toggle tag selection
        if (selectedTag === clickedTag) {
            selectedTag = ''; // Reset to no tag
            tagButtons.forEach(btn => btn.classList.remove('selected')); // Remove selection from all buttons
        } else {
            selectedTag = clickedTag; // Update selected tag
            tagButtons.forEach(btn => btn.classList.remove('selected')); // Clear previous selection
            button.classList.add('selected'); // Highlight clicked tag
        }

        // Update the tag display based on the selected tag
        updateTagDisplay(selectedTag);

        // Fetch and display the filtered data
        fetchAndDisplayData();
    });
});

// Function to render data in the DOM
const showData = (thelist) => {
    let output = "";
    thelist.forEach((doc) => {
        // Generate a CSS class for the border color based on the tag
        const borderClass = `border-${doc.tag}`;

        // Convert ISO date to desired format
        const dateObj = new Date(doc.date);
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        const year = dateObj.getFullYear().toString().slice(2); // Get last two digits of the year

        const formattedDate = `${hours}:${minutes} - ${day}/${month}/${year}`;

        output += `
            <div class="card" data-id="${doc.id}">
                <div class="card-body ${borderClass}">
                    <h5 class="card-title">${doc.title}</h5>
                    <h class="card-date">${formattedDate}</h>
                    <p class="card-text">${doc.description}</p>
                    <button class="btn btn-danger delete" data-id="${doc.id}">Delete</button>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = output;

    // Attach delete event listener to each delete button
    const deleteButtons = document.querySelectorAll(".delete");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const docId = e.target.getAttribute("data-id");
            deleteDocument(docId);
        });
    });
};

// Get Collection Data, sort by date, and show it
const fetchAndDisplayData = () => {
    let q = query(colRef);

    // Apply the tag filter if a tag is selected
    if (selectedTag !== '') {
        q = query(q, where("tag", "==", selectedTag));
    }

    getDocs(q)
        .then((snapshot) => {
            let thelist = [];
            snapshot.docs.forEach((doc) => {
                thelist.push({ ...doc.data(), id: doc.id });
            });

            // Sort the list by date
            thelist.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Sort descending
            });

            showData(thelist); // Call the showData function to display it
        })
        .catch(err => {
            console.log(err);
        });
};

// Event listener for form submission (add new reminder)
form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get input values
    const title = inputTitle.value.trim();
    const description = inputDescription.value.trim();
    const currentDate = new Date();
    const date = currentDate.toISOString(); // Use ISO 8601 format

    // Check if title and description are not empty
    if (title === '' || description === '') {
        alert("Title and Description cannot be empty.");
        return;
    }

    // Add document to Firestore collection
    addDoc(colRef, { tag: selectedTag, title, description, date })
        .then(() => {
            console.log("Document added successfully");
            // Clear input fields
            form.reset();
            selectedTag = ''; // Reset selected tag
            tagButtons.forEach(btn => btn.classList.remove('selected')); // Clear button selection
            updateTagDisplay(''); // Reset tag display
            fetchAndDisplayData(); // Fetch and display data after adding
        })
        .catch((err) => {
            console.log(err);
        });
});

// Delete document from Firestore collection
const deleteDocument = async (id) => {
    try {
        await deleteDoc(doc(db, "thelist", id));
        console.log("Document successfully deleted");
        // Refresh the data list
        fetchAndDisplayData();
    } catch (err) {
        console.log(err);
    }
};

// Function to auto-resize textareas
const autoResize = (textarea) => {
    textarea.style.height = 'auto'; // Reset the height to auto
    textarea.style.height = textarea.scrollHeight + 'px'; // Set height to scrollHeight
};

// Attach input event listeners to the textarea to auto-resize
const descriptionTextarea = document.getElementById('description');
descriptionTextarea.addEventListener('input', () => autoResize(descriptionTextarea));

// Fetch and display data on page load
fetchAndDisplayData();

particlesJS.load('particles-js', 'particles.json', function () {
    console.log('callback - particles.js config loaded');
});
