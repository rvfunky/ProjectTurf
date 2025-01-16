const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("slots.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS Reservations (
            ReservationID INTEGER PRIMARY KEY, 
            BookingDate TEXT NOT NULL, 
            CheckInTime TEXT, 
            CheckOutTime TEXT, 
            TotalPrice DECIMAL(10, 2)
        )`,
        (err) => {
            if (err) {
                console.error("Error while creating Reservations table: ", err.message);
            } else {
                console.log("Table Reservations created successfully.");
            }
        }
    );
});

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Homepage.html"));
});

function getBlockedSlots(date, callback) {
    const now = new Date();
    const query = `SELECT CheckInTime FROM Reservations WHERE BookingDate = ?`;
    db.all(query, [date], (err, rows) => {
        if (err) {
            console.error("Error fetching blocked slots:", err.message);
            callback([]);
        } else {
            const blockedSlots = rows.map(row => row.CheckInTime);
            callback(blockedSlots);
        }
    });
}

app.get("/api/dates/", (req, res) => {
    const hours = [];
    for (let hour = 11; hour <= 21; hour++) {
        hours.push(`${hour}:00`);
    }

    const dates = [];
    for (let today = 0; today < 7; today++) {
        const todayDate = new Date();
        const date = `${todayDate.getDate() + today}-${todayDate.getMonth() + 1}-${todayDate.getFullYear()}`;
        dates.push({ date, hours: [...hours], blockedSlots: [] });
    }

    res.json({ dates });
});

app.get("/api/blockedSlots/", (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Date parameter is missing" });
    }

    getBlockedSlots(date, (blockedSlots) => {
        if (!blockedSlots) {
            return res.status(500).json({ error: "Error fetching blocked slots." });
        }

        res.json({ date, blockedSlots });
    });
});

app.post("/api/reservations/", (req, res) => {
    const { date, slots } = req.body;
    if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ error: "invalid data format" });
    }

    const placeholders = slots.map(() => "(?, ?)").join(", ");
    const query = `INSERT INTO Reservations (BookingDate, CheckInTime) VALUES ${placeholders}`;
    const params = slots.flatMap(slot => [date, slot]);

    db.run(query, params, function (err) {
        if (err) {
            console.error("Error inserting reservations:", err.message);
            return res.status(500).json({ error: "Failed to save reservations." });
        }
        res.status(200).json({ message: "Reservations saved successfully" });
        console.log("Reservations saved successfully");
    });
});

app.listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}`);
});

// if (!mobileInput || !/^[6-9]\d{9}$/.test(mobileInput)) {
//     return res.status(400).json({ error: "Invalid phone number format." });
// }

//     db.run(insertQuery, [mobileInput.trim()], (err) => {
//         if (err) {
//             if (err.message.includes("UNIQUE")) {
//                 res.status(409).json({ error: "Phone number already exists." });
//             } else {
//                 console.error("Error inserting phone number: ", err.message);
//                 res.status(500).json({ error: "Database error." });
//             }
//         } else {
//             res.status(201).json({ message: "Phone number saved successfully." });
//         }
//     });
// });


// const insertQuery = `INSERT INTO Reservations (CustomerMobileNumber, ) VALUES (?)`;
// db.all(query, [], (err, rows) => {
//     if (err) {
//         console.error("Error fetching slots: ", err.message);
//         res.status(500).json({ error: "Error fetching slots." });
//     } else {
//         const dates = rows.reduce((acc, row) => {
//             const dateEntry = acc.find((entry) => entry.date === row.date);
//             if (dateEntry) {
//                 dateEntry.hours.push(row.timeSlot);
//             } else {
//                 acc.push({ date: row.date, hours: [row.timeSlot] });
//             }
//             return acc;
//         }, []);
//         res.json({ dates });
//     }
// });