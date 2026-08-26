const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.setLayout = false; 
app.use(cors());
app.use(express.json());



const mysql = require('mysql2/promise');


// Create the pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '***********',
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



app.post('/api/login', async (req, res) => {

  try{

    const {email, password} = req.body;

    const [rows, fields] = await pool.query('SELECT * FROM student WHERE st_email = ? and st_password = ?;', [email, password]);
    

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
      // Clean up temp file if cook doesn't exist
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Ο μάγειρας δεν βρέθηκε." });
    }
    const cook_id = cookRows[0].cook_id;

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




app.listen(PORT, () => {
    console.log(`🚀 Ο Server του UniBite τρέχει στο http://localhost:${PORT}`);
});