// const continueButton = document.getElementById("submitButton");
// const errorMessage = document.getElementById("errorMessage");
const datePickerContainer = document.getElementById("datePickerContainer");
const dateSelect = document.getElementById("dateSelect");
const hourSlotsContainer = document.getElementById("hourSlots");

document.getElementById("reservationForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const now = new Date();
    fetch("/api/dates")
        .then((response) => response.json())
        .then((fetchedData) => {
            const dates = fetchedData.dates || [];
            const hours = dates[0]?.hours || [];
            const filteredHours = hours.filter(hour => hour > now.getHours());
            console.log(filteredHours);
            populateDates(dates, filteredHours);
        })
        .catch((error) => console.error("Error fetching dates:", error));
});

function populateDates(dates, hours) {
    dateSelect.innerHTML = "";

    const optionPlaceHolder = document.createElement("option");
    optionPlaceHolder.value = "";
    optionPlaceHolder.textContent = "--Select Date--";
    optionPlaceHolder.disabled = true;
    optionPlaceHolder.selected = true;
    datePickerContainer.classList.remove("hidden");
    dateSelect.appendChild(optionPlaceHolder);

    dates.forEach((date) => {
        const option = document.createElement("option");
        option.value = date.date;
        option.textContent = date.date;
        dateSelect.appendChild(option);
    });

    if (dates.length > 0) {
        dateSelect.addEventListener("change", async () => {
            const selectedDate = dateSelect.value;
            if (selectedDate) {
                const blockedSlots = await fetchBlockedSlots(selectedDate);
                generateHourlySlots(dates[0].hours, blockedSlots);
            }
        });
    }
}

async function fetchBlockedSlots(date) {
    try {
        const response = await fetch(`/api/blockedSlots?date=${encodeURIComponent(date)}`);
        if (response.ok) {
            const data = await response.json();
            return data.blockedSlots || [];
        } else {
            console.error("Failed to fetch blocked slots:", response.statusText);
            return [];
        }
    } catch (error) {
        console.error("Error fetching blocked slots:", error);
        return [];
    }
}

function generateHourlySlots(hours, blockedSlots) {
    hourSlotsContainer.innerHTML = "";
    // const now = new Date();

    hours.forEach(hour => {
        const hourSlotsWrapper = document.createElement("div");
        hourSlotsWrapper.classList.add("hourWrapper");

        // if (hour > now.getHours()) {

        const hourCheckbox = document.createElement("input");
        hourCheckbox.type = "checkbox";
        hourCheckbox.value = hour;
        hourCheckbox.id = `checkbox-${hour}`;
        hourCheckbox.classList.add("hourCheckbox");

        if (blockedSlots.includes(hour)) {
            hourCheckbox.disabled = true;
            hourSlotsWrapper.classList.add("slotUnAvailable");
        } else {
            hourSlotsWrapper.classList.add("slotAvailable");
        }

        const label = document.createElement("label");
        label.htmlFor = `checkbox-${hour}`;
        label.textContent = hour;

        hourSlotsWrapper.appendChild(hourCheckbox);
        hourSlotsWrapper.appendChild(label);
        hourSlotsContainer.appendChild(hourSlotsWrapper);
        // }
    });

    const nextButton = document.createElement("button");
    nextButton.textContent = "Continue";
    nextButton.classList.add("nextButton");
    nextButton.style.display = "none";
    hourSlotsContainer.appendChild(nextButton);

    const checkBoxes = document.querySelectorAll(".hourCheckbox");

    hourSlotsContainer.addEventListener("change", () => {
        const anyChecked = Array.from(checkBoxes).some(checkbox => checkbox.checked);
        nextButton.style.display = anyChecked ? "block" : "none";
    });

    dateSelect.addEventListener("change", () => {
        checkBoxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    nextButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const selectedSlots = Array.from(checkBoxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        const selectedDate = dateSelect.value;

        if (selectedDate && selectedSlots.length > 0) {
            console.log("Selected Date:", selectedDate);
            console.log("Selected Slots:", selectedSlots);

            await sendSlots(selectedDate, selectedSlots);
        } else {
            console.error("No date or slots selected.");
        }
    });

    hourSlotsContainer.classList.remove("hidden");
}

async function sendSlots(selectedDate, selectedSlots) {
    try {
        const response = await fetch("/api/reservations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ date: selectedDate, slots: selectedSlots }),
        });

        if (response.ok) {
            console.log("Slots successfully sent to the server.");
        } else {
            console.error("Failed to send slots. Server responded with:", response.statusText);
        }
    } catch (error) {
        console.error("Error sending slots:", error);
    }
}

// const mobileInput = document.getElementById("mobileNumber").value.trim();
// console.log(mobileInput);

// if (/^[6-9]\d{9}$/.test(mobileInput)) {
//     try {
//         const response = await fetch("/api/reservations", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ mobileInput }),
//         });

//         const result = await response.json();
//         if (response.ok) {
//             console.log("Mobile number saved successfully.");
//             errorMessage.style.display = "none";
//             datePickerContainer.classList.remove("hidden");
//         } else {
//             console.error(`Error: ${result.error}`);
//         }
//     } catch (error) {
//         console.error("Error submitting mobile number: ", error);
//     }
// } else {
//     errorMessage.style.display = "block";
//     errorMessage.textContent =
//         "Invalid mobile number. Please re-check and provide a correct mobile number.";
//     // datePickerContainer.classList.add("hidden");

// }
//     } else {
//         errorMessage.style.display = "block";
//         errorMessage.textContent =
//             "Invalid mobile number. Please re-check and provide a correct mobile number.";
//         datePickerContainer.classList.add("hidden");
//     }


// function validateMobileNumber(mobile) {
//     const regex = /^[6-9]\d{9}$/;
//     return regex.test(mobile);
// }

// const label = document.createElement("label");
// label.htmlFor = `checkbox-${hour}`;
// label.textContent = hour;
// hourSlotsContainer.append(hourCheckbox);
// hourSlotsContainer.appendChild(label);

// continueButton.addEventListener("click", () => {
//     const mobile = mobileInput.value.trim();
//     if (validateMobileNumber(mobile)) {
//         errorMessage.style.display = "none";
//         datePickerContainer.classList.remove("hidden");

//         fetch("/api/dates")
//             .then((response) => response.json())
//             .then((fetchedData) => {
//                 data = fetchedData.dates || [];
//                 const hours = data[0]?.hours || [];
//                 populateDates(data, hours);
//             })
//             .catch((error) => console.error("Error fetching dates:", error));
//     } else {
//         errorMessage.style.display = "block";
//         errorMessage.textContent =
//             "Invalid mobile number. Please re-check and provide a correct mobile number.";
//         datePickerContainer.classList.add("hidden");
//     }
// });

// dateSelect.addEventListener("change", (event) => {
//     const selectedDate = event.target.value;
//     const selectedDateObj = data.find((d) => d.date === selectedDate);

//     if (selectedDateObj) {
//         generateHourlySlots(selectedDateObj.hours);
//     } else {
//         console.error("No hours found for the selected date");
//     }
// });
