const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const multer = require('multer');
const path = require('path');


// This serves your static frontend files from your project root folder
app.use(express.static(path.join(__dirname, "../")));


const fs = require('fs');

app.setLayout = false; 
app.use(cors());
app.use(express.json());



const mysql = require('mysql2/promise');


// Create the pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SpIdEr.exe#!1321',
    database: 'unibite_db',
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on your server resources
    queueLimit: 0,
    enableKeepAlive: true,
    idleTimeout: 60000 // Idle connections will be released after 60s
});


const UPLOAD_DIR = '/home/vboxuser/Personal_Work/WEB_PROJECT/database/photos'; // Change this to your exact path

// Ensure the directory exists when the server starts
if (!fs.existsSync(UPLOAD_DIR)){
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 2. Configure multer to save temporarily using a generic name first
const upload = multer({ 
  dest: path.join(__dirname, 'temp_uploads/'), // Temporary holding folder
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});



function isAdminEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // Clean up whitespace and convert to lowercase for safety
    const cleanEmail = email.trim().toLowerCase();
    
    // Split the email into local part (before @) and domain (after @)
    const parts = cleanEmail.split('@');
    
    if (parts.length !== 2) return false; // Invalid email format
    
    // Check if the local part starts with 'adm_' and has characters after it
    const localPart = parts[0];
    return localPart.startsWith('adm_') && localPart.length > 4;
}


/*
app.post('/api/login', async (req, res) => {

  try{

    const {email, password} = req.body;

    const [rows, fields] = await pool.query('SELECT * FROM student WHERE st_email = ? and st_password = ?;', [email, password]);
    

    if(isAdminEmail(email)){
      const [rows, fields] = await pool.query('SELECT * FROM admin WHERE adm_email = ? and adm_password = ?;', [email, password]);

    }



    if (rows.length > 0) {
            // User found
            rows[0]["property"] = "student";
            console.log(rows[0]);
            res.json({ user: rows[0] });
        } else {
            // User not found
            res.status(401).json({ message: 'Λάθος email ή κωδικός πρόσβασης.' });
        }

  }catch (error) {
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
   }

})
*/



app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let rows = [];

        if (isAdminEmail(email)) {
            // Query the admin table if it matches the admin email pattern
            const [adminRows] = await pool.query('SELECT * FROM admin WHERE adm_email = ? and adm_password = ?;', [email, password]);
            rows = adminRows;
            if (rows.length > 0) {
                rows[0]["property"] = "admin";
            }
        } else {
            // Query the student table otherwise
            const [studentRows] = await pool.query('SELECT * FROM student WHERE st_email = ? and st_password = ?;', [email, password]);
            rows = studentRows;
            if (rows.length > 0) {
                rows[0]["property"] = "student";
            }
        }

        if (rows.length > 0) {
            // User found
            console.log(rows[0]);
            res.json({ user: rows[0] });
        } else {
            // User not found
            res.status(401).json({ message: 'Λάθος email ή κωδικός πρόσβασης.' });
        }

    } catch (error) {
        console.error("Σφάλμα σύνδεσης:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});




app.post('/api/register', async (req, res) => {

  
  try{
    const {fullname, university, email, password} = req.body;

    const [firstName, lastName] = fullname.split(" ");

    //console.log([full_name, fullname, university, email, password]);
    try{
      await pool.execute('INSERT INTO student (st_name, st_surname, st_university, st_email, st_password, st_points) VALUES(?, ?, ?, ?, ?, 5);', [firstName, lastName, university, email, password]);

    }catch(error){
      //console.error("Database Error:" error);
      if(error.errno = 1062){
        res.status(500).json({ message: 'Το email που έβαλες χρησιμοποιήτε από άλλον' });
      }
    }

    res.status(201).json({ message: "User registered successfully" });

  }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
   }
  

})



app.get('/api/my-ads', async (req, res) => {


    try{
      const studentId = req.query.st_id;

      await pool.execute("CALL update_food_status();");


      //const query = 'SELECT * FROM delivery inner join food on deli_food_id=food_id inner join cook on food_cook_id=cook_id inner join student on cook_st_id=st_id where st_id = ?';
      const query = 'SELECT * FROM food inner join cook on food.food_cook_id = cook.cook_id where cook_st_id = ? and food.food_status = ?'
      const [rows, fields] = await pool.execute(query, [studentId, "ONGOING"])

      if (rows.length > 0) {
            // User found
            console.log(rows);
            res.json(rows);
        } else {
            // User not found
            res.status(401).json({ message: 'Λάθος email ή κωδικός πρόσβασης.' });
        }
     
      
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
   }

    
});



app.post('/api/ads', upload.single('photo'), async (req, res) => {
  try {
    const { 
      studentId, 
      createdAt, 
      title, 
      delivery_datetimeFrom, 
      delivery_datetimeTo, 
      servings, 
      notes, 
      allergens, 
      address, 
      lat, 
      lng, 
      university 
    } = req.body;

    const [cookRows] = await pool.execute("SELECT cook_id FROM cook WHERE cook_st_id = ?", [studentId]);
    if (cookRows.length === 0) {

      await pool.execute("INSERT INTO cook (cook_st_id) values(?)", [studentId]);
      // Clean up temp file if cook doesn't exist
      //if (req.file) fs.unlinkSync(req.file.path);
      //return res.status(404).json({ message: "Ο μάγειρας δεν βρέθηκε." });
    }else{
      const cook_id = cookRows[0].cook_id;
    }

    const [cookRows1] = await pool.execute("SELECT cook_id FROM cook WHERE cook_st_id = ?", [studentId]);
    const cook_id = cookRows1[0].cook_id;
    

    // Step 3: Insert the food record into MySQL first (leaving image null for a second)
    const sql_food = `
      INSERT INTO food(
        food_timestamp, food_title, food_cook_id, food_portion, 
        food_image, food_notes, food_allergens, food_time_start, 
        food_time_end, food_status, food_lat, food_lng, food_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql_food, [
      createdAt, 
      title, 
      cook_id, 
      servings, 
      null, // Temporary null image
      notes, 
      allergens, 
      delivery_datetimeFrom, 
      delivery_datetimeTo, 
      "ONGOING", 
      lat, 
      lng, 
      address
    ]);

    // Step 4: Get the newly created food_id
    const foodId = result.insertId;
    let finalImageName = null;

    // Step 5: If a photo was uploaded, rename/move it to [food_id].jpg in your given path
    if (req.file) {
      finalImageName = `${foodId}.jpg`;
      const targetPath = path.join(UPLOAD_DIR, finalImageName);

      // Move file from temp folder to final destination path
      fs.renameSync(req.file.path, targetPath);

      // Step 6: Update the row with the correct filename
      await pool.execute("UPDATE food SET food_image = ? WHERE food_id = ?", [targetPath, foodId]);
    }

    res.status(201).json({ message: "Επιτυχής αποθήκευση", foodId });

  } catch (error) {
    console.error(error);
    // Clean up temp file if something crashed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }
});



app.delete('/api/ads/:id', async (req,res) => {

  const foodId = req.params.id;

  try {
    // 1. (Optional but recommended) Fetch the record first to get the image filename 
    // in case it doesn't strictly follow `[food_id].jpg`
    const [rows] = await pool.execute("SELECT food_image FROM food WHERE food_id = ?", [foodId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
    }

    const imageFilename = rows[0].food_image;

    // 2. Delete the record from the MySQL database
    const [result] = await pool.execute("DELETE FROM food WHERE food_id = ?", [foodId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Αποτυχία διαγραφής από τη βάση δεδομένων." });
    }

    // 3. Delete the physical image file from the server machine if it exists
    if (imageFilename) {
      const imagePath = path.join(UPLOAD_DIR, imageFilename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: "Η αγγελία και η εικόνα της διαγράφηκαν επιτυχώς." });

  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή της αγγελίας:", error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }

});



// Get a single ad by ID for editing
app.get('/api/ads/:id', async (req, res) => {
    const foodId = req.params.id;

    try {
        // Query your database for the specific food item
        // Adjust column names (e.g., food_id, food_title) if they differ in your database schema
        const [rows] = await pool.execute(
            'SELECT * FROM food WHERE food_id = ?', 
            [foodId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
        }

        // Return the first matching ad object
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αγγελίας:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});



app.put('/api/ads/:id', upload.single('photo'), async (req, res) => {
    const foodId = req.params.id;
    
    try {
        // 1. Grab all possible fields from req.body
        const { 
            title, 
            delivery_datetimeFrom, 
            delivery_datetimeTo, 
            servings, 
            notes, 
            allergens, 
            address, 
            lat, 
            lng 
        } = req.body;

        // 2. Dynamically build arrays for SQL clauses
        let fieldsToUpdate = [];
        let queryParams = [];

        if (title !== undefined) {
            fieldsToUpdate.push("food_title = ?");
            queryParams.push(title);
        }
        if (delivery_datetimeFrom !== undefined && delivery_datetimeFrom !== "null") {
            fieldsToUpdate.push("food_time_start = ?");
            queryParams.push(delivery_datetimeFrom);
        }
        if (delivery_datetimeTo !== undefined && delivery_datetimeTo !== "null") {
            fieldsToUpdate.push("food_time_end = ?");
            queryParams.push(delivery_datetimeTo);
        }
        if (servings !== undefined) {
            fieldsToUpdate.push("food_portion = ?");
            queryParams.push(servings);
        }
        if (notes !== undefined) {
            fieldsToUpdate.push("food_notes = ?");
            queryParams.push(notes);
        }
        if (allergens !== undefined) {
            fieldsToUpdate.push("food_allergens = ?");
            queryParams.push(allergens);
        }
        if (address !== undefined) {
            fieldsToUpdate.push("food_address = ?");
            queryParams.push(address);
        }
        if (lat !== undefined) {
            fieldsToUpdate.push("food_lat = ?");
            queryParams.push(lat);
        }
        if (lng !== undefined) {
            fieldsToUpdate.push("food_lng = ?");
            queryParams.push(lng);
        }

        // 3. Handle image file update conditionally if a new photo was uploaded
        if (req.file) {
            const finalImageName = `${foodId}.jpg`;
            const targetPath = path.join(UPLOAD_DIR, finalImageName);

            // Copy safely and clear temp file
            fs.copyFileSync(req.file.path, targetPath);
            fs.unlinkSync(req.file.path);

            fieldsToUpdate.push("food_image = ?");
            queryParams.push(finalImageName);
        }

        // If no fields were provided to change
        if (fieldsToUpdate.length === 0) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Δεν δόθηκαν στοιχεία προς ενημέρωση." });
        }

        // Push the foodId at the very end for the WHERE clause
        queryParams.push(foodId);

        // 4. Construct the final dynamic SQL statement
        const sql = `UPDATE food SET ${fieldsToUpdate.join(', ')} WHERE food_id = ?`;

        const [result] = await pool.execute(sql, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
        }

        res.status(200).json({ message: "Η αγγελία ενημερώθηκε επιτυχώς!" });

    } catch (error) {
        console.error("Σφάλμα ενημέρωσης:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});




app.get('/api/nearby-ads', async (req, res) => {
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLng = req.query.lng ? parseFloat(req.query.lng) : null;
    const maxRadius = 25; // 10 χιλιόμετρα
    console.log([userLat, userLng]);
    try {

        await pool.execute("CALL update_food_status();");

        let query, params;

        // Αν ΕΧΟΥΜΕ συντεταγμένες, υπολογίζουμε απόσταση
        if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
            query = `
                SELECT *, 
                    (6371 * ACOS(
                        COS(RADIANS(?)) * COS(RADIANS(food_lat)) * 
                        COS(RADIANS(food_lng) - RADIANS(?)) + 
                        SIN(RADIANS(?)) * SIN(RADIANS(food_lat))
                    )) AS distance_km
                FROM food inner join cook on food_cook_id=cook_id inner join student on cook_st_id=st_id
                HAVING distance_km <= ? and food_status = ?
                ORDER BY distance_km ASC
            `;
            params = [userLat, userLng, userLat, maxRadius, "ONGOING"];

        } else {
            // Αν ΔΕΝ έχουμε συντεταγμένες, επιστρέφουμε απλά όλα τα γεύματα
            query = `SELECT * FROM food inner join cook on food_cook_id=cook_id inner join student on cook_st_id=st_id where food_status = ?`;
            params = ["ONGOING"];
        }

        const [rows] = await pool.execute(query, params); // Οπισθοδρόμηση: pool.execute(query, params)
        console.log(rows);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα υπολογισμού απόστασης:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});




app.post('/api/requests', async (req,res) => {

  try{

    const { cookId, consumerId, foodId, requestedServings } = req.body;
    console.log({ cookId, consumerId, foodId, requestedServings });

    const [consRows] = await pool.execute("SELECT cons_id FROM consumer WHERE cons_st_id = ?", [consumerId]);
    if (consRows.length === 0) {

      await pool.execute("INSERT INTO consumer (cons_st_id) values(?)", [consumerId]);
      // Clean up temp file if cook doesn't exist
      //if (req.file) fs.unlinkSync(req.file.path);
      //return res.status(404).json({ message: "Ο μάγειρας δεν βρέθηκε." });
    }

    const [consRows1] = await pool.execute("SELECT cons_id FROM consumer WHERE cons_st_id = ?", [consumerId]);
    const cons_id = consRows1[0].cons_id;

    const sql = `INSERT INTO requests (req_cook_id, req_cons_id, req_food_id, req_servings, req_status) values (?, ?, ?, ?, ?);`

    await pool.execute(sql, [cookId, cons_id, foodId, requestedServings, "pending"]);

    res.status(200).json({ message: "Το αίτημα αποθηκεύτηκε επιτυχώς!" });


  }catch (error){
    console.error("Σφάλμα αποθήκευσης αιτήματος:", error);
    res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }

});



/*
app.get('/api/cook-requests', async (req,res) => {

  const stId = req.query.st_id;

  try{

    //const sql = `SELECT req_id, req_cons_id, req_food_id, req_servings, food_title FROM requests INNER JOIN cook on req_cook_id = cook_id inner join student on cook_st_id=st_id WHERE st_id = ?`;
    const sql = `SELECT * FROM requests INNER JOIN food on req_food_id=food_id inner join cook on food_cook_id = cook_id inner join student on cook_st_id=st_id WHERE st_id = ?`;

    const [reqRows] = await pool.execute(sql, [stId]);

    const [consName] = await pool.query(`SELECT st_name as cons_name from student inner join consumer on st_id=cons_st_id where cons_id = ?`, reqRows[0].req_cons_id);

    const allRows = Object.assign({}, reqRows[0], consName[0]);

    console.log([allRows]);

    if (reqRows.length === 0) {
            return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
    }


    res.status(200).json([allRows]);

  }catch (error) {
        console.error("Σφάλμα ανάκτησης αιτημάτων:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
  }

});

*/



app.get('/api/cook-requests', async (req, res) => {
    const stId = req.query.st_id;

    if (!stId) {
        return res.status(400).json({ message: "Απαιτείται το ID του χρήστη." });
    }

    try {
        const sql = `
            SELECT 
                r.req_id, 
                r.req_cook_id, 
                r.req_cons_id, 
                r.req_food_id, 
                r.req_servings, 
                r.req_status,
                f.food_title,
                f.food_address,
                cons_student.st_name AS consumerName
            FROM requests r
            INNER JOIN food f ON r.req_food_id = f.food_id
            INNER JOIN cook c ON r.req_cook_id = c.cook_id
            INNER JOIN student cook_student ON c.cook_st_id = cook_student.st_id
            INNER JOIN consumer cons ON r.req_cons_id = cons.cons_id
            INNER JOIN student cons_student ON cons.cons_st_id = cons_student.st_id
            WHERE cook_student.st_id = ? and r.req_status = "pending" or cook_student.st_id = ? and r.req_status = "ongoing"
        `;

        const [reqRows] = await pool.execute(sql, [stId, stId]);

        console.log(reqRows);

        // Επιστρέφει απευθείας όλα τα δεδομένα μαζί με το όνομα του καταναλωτή
        res.status(200).json(reqRows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αιτημάτων:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});




app.put('/api/requests/:id', async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;

    // Ορισμός των επιτρεπόμενων καταστάσεων
    const validStatuses = ['pending', 'ongoing', 'completed', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Μη έγκυρη κατάσταση αιτήματος." });
    }

    try {
        const sql = `UPDATE requests SET req_status = ? WHERE req_id = ?`;
        const [result] = await pool.execute(sql, [status, requestId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Το αίτημα δεν βρέθηκε." });
        }

        // 2. Αν η κατάσταση γίνει 'ongoing' (αποδοχή), τρέχουμε το procedure για τις μερίδες
        if (status === 'ongoing') {
            await pool.query("CALL update_food_portions(?)", [requestId]);
        }

        res.status(200).json({ message: "Το αίτημα ενημερώθηκε επιτυχώς!" });

    } catch (error) {
        console.error("Σφάλμα ενημέρωσης αιτήματος:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});






app.get('/api/consumer-requests', async (req, res) => {
    const studentId = req.query.st_id;

    if (!studentId) {
        return res.status(400).json({ message: "Απαιτείται το ID του φοιτητή." });
    }

    try {
        const sql = `
            SELECT 
                r.req_id, 
                r.req_servings, 
                r.req_status,
                f.food_title,
                cook_student.st_name AS cookName
            FROM requests r
            INNER JOIN consumer cons ON r.req_cons_id = cons.cons_id
            INNER JOIN food f ON r.req_food_id = f.food_id
            INNER JOIN cook c ON r.req_cook_id = c.cook_id
            INNER JOIN student cook_student ON c.cook_st_id = cook_student.st_id
            WHERE cons.cons_st_id = ?
        `;

        const [rows] = await pool.execute(sql, [studentId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης κρατήσεων καταναλωτή:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});





app.get('/api/orders/completed', async (req, res) => {
    const consumerId = req.query.consumerId;

    if (!consumerId) {
        return res.status(400).json({ message: "Απαιτείται το ID του καταναλωτή." });
    }

    try {
        const sql = `
            SELECT 
                r.req_id AS id,
                r.req_servings,
                r.req_status,
                f.food_id AS foodId,
                f.food_title AS title,
                f.food_image AS image,
                cook_student.st_name AS cookName,
                rt.rating
            FROM requests r
            INNER JOIN consumer cons ON r.req_cons_id = cons.cons_id
            INNER JOIN food f ON r.req_food_id = f.food_id
            INNER JOIN cook c ON r.req_cook_id = c.cook_id
            INNER JOIN student cook_student ON c.cook_st_id = cook_student.st_id
            LEFT JOIN ratings rt ON rt.food_id = r.req_food_id 
                AND rt.cons_id = r.req_cons_id 
                AND rt.cook_id = r.req_cook_id
            WHERE cons.cons_st_id = ? AND r.req_status = ?
        `;

        const [rows] = await pool.execute(sql, [consumerId, 'completed']);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης ολοκληρωμένων παραγγελιών:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});



//rating by consumer
app.put('/api/orders/:reqId/rate', async (req, res) => {
    const reqId = req.params.reqId;
    const { rating } = req.body;

    // Validate rating value (1 to 5)
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Μη έγκυρη βαθμολογία. Πρέπει να είναι μεταξύ 1 και 5." });
    }

    try {
        // 1. Retrieve the cook, consumer, and food IDs associated with this request
        const [reqRows] = await pool.execute(
            `SELECT req_cook_id, req_cons_id, req_food_id FROM requests WHERE req_id = ?`,
            [reqId]
        );

        if (reqRows.length === 0) {
            return res.status(404).json({ message: "Το αίτημα δεν βρέθηκε." });
        }

        const { req_cook_id, req_cons_id, req_food_id } = reqRows[0];

        // 2. Check if a rating for this combination already exists
        const [existingRating] = await pool.execute(
            `SELECT rat_id FROM ratings WHERE cook_id = ? AND cons_id = ? AND food_id = ?`,
            [req_cook_id, req_cons_id, req_food_id]
        );

        if (existingRating.length > 0) {
            // Update existing rating if the user changes it
            await pool.execute(
                `UPDATE ratings SET rating = ? WHERE rat_id = ?`,
                [rating, existingRating[0].rat_id]
            );
        } else {
            // Insert a new rating record
            await pool.execute(
                `INSERT INTO ratings (cook_id, cons_id, food_id, rating) VALUES (?, ?, ?, ?)`,
                [req_cook_id, req_cons_id, req_food_id, rating]
            );
        }

        res.status(200).json({ message: "Η αξιολόγηση αποθηκεύτηκε επιτυχώς!" });

    } catch (error) {
        console.error("Σφάλμα αποθήκευσης αξιολόγησης:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});




//ratings in cook's page
app.get('/api/cook/ratings', async (req, res) => {
    const cookId = req.query.cookId;

    if (!cookId) {
        return res.status(400).json({ message: "Απαιτείται το ID του μάγειρα (cookId)." });
    }

    try {
        const sql = `
            SELECT 
                f.food_title AS adTitle,
                cons_student.st_name AS consumerName,
                rt.rating,
                COALESCE(r.req_servings, 1) AS servings
            FROM ratings rt
            INNER JOIN cook c ON rt.cook_id = c.cook_id
            INNER JOIN food f ON rt.food_id = f.food_id
            INNER JOIN consumer cons ON rt.cons_id = cons.cons_id
            INNER JOIN student cons_student ON cons.cons_st_id = cons_student.st_id
            LEFT JOIN requests r ON r.req_food_id = rt.food_id 
                AND r.req_cons_id = rt.cons_id 
                AND r.req_cook_id = rt.cook_id
            WHERE c.cook_id = ? OR c.cook_st_id = ?
        `;

        // Pass cookId twice to cover whether the frontend sent the cook_id or the student's st_id
        const [rows] = await pool.execute(sql, [cookId, cookId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αξιολογήσεων μάγειρα:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});



/// ADMIN STUFF



async function getTotalPortionsLastMonth(pool) {
  const query = `
    SELECT COALESCE(SUM(f.food_portion), 0) AS total_portions
    FROM food f
    JOIN requests r ON f.food_id = r.req_food_id
    WHERE f.food_status = 'FINISHED' 
      AND f.food_timestamp >= NOW() - INTERVAL 1 MONTH;
  `;
  const [rows] = await pool.query(query);
  return rows[0].total_portions;
}




async function getTopDonor(pool) {
  const query = `
    SELECT s.st_id, s.st_name, s.st_surname, s.st_email, COALESCE(SUM(f.food_portion), 0) AS total_donated_portions
    FROM student s
    JOIN cook c ON s.st_id = c.cook_st_id
    JOIN food f ON c.cook_id = f.food_cook_id
    WHERE f.food_status = 'FINISHED'
    GROUP BY s.st_id, s.st_name, s.st_surname, s.st_email
    ORDER BY total_donated_portions DESC
    LIMIT 1;
  `;
  const [rows] = await pool.query(query);
  return rows[0] || null;
}




async function getTopMeals(pool) {
  const query = `
    SELECT f.food_id, f.food_title, f.food_portion, COUNT(r.req_id) AS total_requests
    FROM food f
    JOIN requests r ON f.food_id = r.req_food_id
    WHERE f.food_status = 'FINISHED'
    GROUP BY f.food_id, f.food_title, f.food_portion
    ORDER BY total_requests DESC
    LIMIT 5;
  `;
  const [rows] = await pool.query(query);
  return rows;
}




app.get('/api/admin/stats/monthly-portions', async (req, res) => {
  try {
    const totalPortions = await getTotalPortionsLastMonth(pool);
    res.json({ success: true, totalPortionsLastMonth: totalPortions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




app.get('/api/admin/leaderboard', async (req, res) => {
  try {
    const topDonor = await getTopDonor(pool);
    const topMeals = await getTopMeals(pool);
    res.json({ success: true, leaderboard: { topDonor, topMeals } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});







app.listen(PORT, () => {
    console.log(`🚀 Ο Server του UniBite τρέχει στο http://localhost:${PORT}`);
});