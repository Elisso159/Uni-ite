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
    password: '703d1bed99E!2005',
    database: 'unibite_db',
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0,
    enableKeepAlive: true,
    idleTimeout: 60000 
});


const UPLOAD_DIR = '/home/totoro/Έγγραφα/University/Sixth_Semester/Web/database/photos'; 

if (!fs.existsSync(UPLOAD_DIR)){
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ 
  dest: path.join(__dirname, 'temp_uploads/'), 
  limits: { fileSize: 2 * 1024 * 1024 } 
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

    console.log([full_name, fullname, university, email, password]);
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
    

    // Insert the food record into MySQL first (leaving image null for a second)
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

    // Get the newly created food_id
    const foodId = result.insertId;
    let finalImageName = null;

    //If a photo was uploaded, rename/move it to [food_id].jpg in your given path
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
    // Fetch the record first to get the image filename 
    const [rows] = await pool.execute("SELECT food_image FROM food WHERE food_id = ?", [foodId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
    }

    const imageFilename = rows[0].food_image;

    // Delete the record from the MySQL database
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
        const [rows] = await pool.execute(
            'SELECT * FROM food WHERE food_id = ?', 
            [foodId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Η αγγελία δεν βρέθηκε." });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αγγελίας:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

app.put('/api/ads/:id', upload.single('photo'), async (req, res) => {
    const foodId = req.params.id;
    
    try {
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

        if (req.file) {
            const finalImageName = `${foodId}.jpg`;
            const targetPath = path.join(UPLOAD_DIR, finalImageName);

            fs.copyFileSync(req.file.path, targetPath);
            fs.unlinkSync(req.file.path);

            fieldsToUpdate.push("food_image = ?");
            queryParams.push(finalImageName);
        }

        if (fieldsToUpdate.length === 0) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Δεν δόθηκαν στοιχεία προς ενημέρωση." });
        }

        queryParams.push(foodId);

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
    const maxRadius = 25;

    try {
        await pool.execute("CALL update_food_status();");

        let query, params;

        if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
            query = `
                SELECT *, 
                    (6371 * ACOS(
                        COS(RADIANS(?)) * COS(RADIANS(food_lat)) * 
                        COS(RADIANS(food_lng) - RADIANS(?)) + 
                        SIN(RADIANS(?)) * SIN(RADIANS(food_lat))
                    )) AS distance_km
                FROM food 
                INNER JOIN cook ON food_cook_id = cook_id 
                INNER JOIN student ON cook_st_id = st_id
                HAVING distance_km <= ? AND food_status = ?
                ORDER BY distance_km ASC
            `;
            params = [userLat, userLng, userLat, maxRadius, "ONGOING"];

        } else {
            query = `
                SELECT * 
                FROM food 
                INNER JOIN cook ON food_cook_id = cook_id 
                INNER JOIN student ON cook_st_id = st_id 
                WHERE food_status = ?
            `;
            params = ["ONGOING"];
        }

        const [rows] = await pool.execute(query, params);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα υπολογισμού απόστασης:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

app.post('/api/requests', async (req, res) => {
    try {
        const { cookId, consumerId, foodId, requestedServings } = req.body;

        const [consRows] = await pool.execute("SELECT cons_id FROM consumer WHERE cons_st_id = ?", [consumerId]);
        if (consRows.length === 0) {
            await pool.execute("INSERT INTO consumer (cons_st_id) VALUES (?)", [consumerId]);
        }

        const [consRows1] = await pool.execute("SELECT cons_id FROM consumer WHERE cons_st_id = ?", [consumerId]);
        const cons_id = consRows1[0].cons_id;

        const sql = `INSERT INTO requests (req_cook_id, req_cons_id, req_food_id, req_servings, req_status) VALUES (?, ?, ?, ?, ?);`;

        await pool.execute(sql, [cookId, cons_id, foodId, requestedServings, "pending"]);

        res.status(200).json({ message: "Το αίτημα αποθηκεύτηκε επιτυχώς!" });

    } catch (error) {
        console.error("Σφάλμα αποθήκευσης αιτήματος:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

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
            WHERE cook_student.st_id = ? AND (r.req_status = 'pending' OR r.req_status = 'ongoing')
        `;

        const [reqRows] = await pool.execute(sql, [stId]);
        res.status(200).json(reqRows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αιτημάτων:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

app.put('/api/requests/:id', async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'ongoing', 'completed', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Μη έγκυρη κατάσταση αιτήματος." });
    }

    try {
        let sql, params;

        if (status === 'completed') {
            sql = `UPDATE requests SET req_status = ?, completed_at = NOW() WHERE req_id = ?`;
            params = [status, requestId];
        } else {
            sql = `UPDATE requests SET req_status = ? WHERE req_id = ?`;
            params = [status, requestId];
        }

        const [result] = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Το αίτημα δεν βρέθηκε." });
        }

        if (status === 'ongoing') {
            await pool.query("CALL update_food_portions(?)", [requestId]);
        }

        res.status(200).json({ message: "Το αίτημα ενημερώθηκε επιτυχώς!" });

    } catch (error) {
        console.error("Σφάλμα ενημέρωσης αιτήματος:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

// Endpoint για ανάκτηση κρατήσεων καταναλωτή
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
            r.completed_at,
            f.food_title,
            f.food_address,
            f.food_time_start,
            f.food_time_end,
            s.st_name AS cookName
        FROM requests r
        INNER JOIN consumer c ON r.req_cons_id = c.cons_id
        INNER JOIN food f ON r.req_food_id = f.food_id
        INNER JOIN cook ck ON f.food_cook_id = ck.cook_id
        INNER JOIN student s ON ck.cook_st_id = s.st_id
        WHERE c.cons_st_id = ?
        ORDER BY r.req_id DESC
        `;

        const [rows] = await pool.execute(sql, [studentId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης κρατήσεων καταναλωτή:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});

app.get('/api/orders/completed', async (req, res) => {
    const studentId = req.query.st_id || req.query.consumerId;

    if (!studentId) {
        return res.status(400).json({ message: "Απαιτείται το ID του φοιτητή." });
    }

    try {
        await pool.execute('CALL PenaltyForUnratedOrders()');
        const sql = `
            SELECT 
                r.req_id,
                r.req_servings,
                r.req_status,
                r.completed_at,
                f.food_title AS title,
                f.food_image AS image,
                s.st_name AS cookName,
                rt.rating AS rating
            FROM requests r
            INNER JOIN consumer c ON r.req_cons_id = c.cons_id
            INNER JOIN food f ON r.req_food_id = f.food_id
            INNER JOIN cook ck ON f.food_cook_id = ck.cook_id
            INNER JOIN student s ON ck.cook_st_id = s.st_id
            LEFT JOIN ratings rt ON rt.food_id = f.food_id AND rt.cons_id = c.cons_id
            WHERE c.cons_st_id = ? 
              AND r.req_status = 'completed'
            ORDER BY (rt.rating IS NULL) DESC, r.req_id DESC
        `;

        const [rows] = await pool.execute(sql, [studentId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης ολοκληρωμένων παραγγελιών:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.', error: error.message });
    }
});

app.put('/api/orders/:reqId/rate', async (req, res) => {
    const reqId = req.params.reqId;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Η αξιολόγηση πρέπει να είναι από 1 έως 5." });
    }

    try {
        //Ανάκτηση cons_id, food_id και cook_id για την παραγγελία
        const [orderRows] = await pool.execute(`
            SELECT 
                r.req_cons_id AS cons_id, 
                r.req_food_id AS food_id, 
                f.food_cook_id AS cook_id
            FROM requests r
            INNER JOIN food f ON r.req_food_id = f.food_id
            WHERE r.req_id = ?
        `, [reqId]);

        if (orderRows.length === 0) {
            return res.status(404).json({ message: "Η παραγγελία δεν βρέθηκε." });
        }

        const { cons_id, food_id, cook_id } = orderRows[0];

        // Έλεγχος αν έχει ήδη αξιολογηθεί
        const [existingRating] = await pool.execute(`
            SELECT rat_id FROM ratings 
            WHERE cons_id = ? AND food_id = ?
        `, [cons_id, food_id]);

        if (existingRating.length > 0) {
            return res.status(400).json({ message: "Η παραγγελία έχει ήδη αξιολογηθεί και δεν μπορεί να αλλάξει." });
        }

        // Εισαγωγή της αξιολόγησης στον πίνακα ratings
        await pool.execute(`
            INSERT INTO ratings (cook_id, cons_id, food_id, rating) 
            VALUES (?, ?, ?, ?)
        `, [cook_id, cons_id, food_id, rating]);

        // 4. Κλήση της Stored Procedure UpdateCookRating με 2 παραμέτρους (cook_id, rating)
        await pool.execute(`CALL UpdateCookRating(?, ?)`, [cook_id, rating]);

        res.status(200).json({ message: "Η αξιολόγηση υποβλήθηκε και οι πόντοι του μάγειρα ενημερώθηκαν επιτυχώς!" });

    } catch (error) {
        console.error("Database error during rating:", error);
        res.status(500).json({ message: "Σφάλμα διακομιστή κατά την αποθήκευση της αξιολόγησης." });
    }
});

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

        const [rows] = await pool.execute(sql, [cookId, cookId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Σφάλμα ανάκτησης αξιολογήσεων μάγειρα:", error);
        res.status(500).json({ message: 'Σφάλμα διακομιστή.' });
    }
});



/// ADMIN STUFF



async function getTotalPortionsLastMonth(pool) {
  /*const query = `
    SELECT COUNT(f.food_id) AS total_portions
    FROM food f
    WHERE LOWER(f.food_status) = 'finished'
      AND f.food_timestamp >= NOW() - INTERVAL 1 MONTH;
  `;*/

    const query = `
    SELECT COUNT(f.food_id) AS total_portions
    FROM food f
    WHERE LOWER(f.food_status) = 'finished';
  `;
  const [rows] = await pool.query(query);
  return Number(rows[0].total_portions);
}



async function getTopDonor(pool) {
  const query = `
    SELECT 
      s.st_id, 
      s.st_name, 
      s.st_surname, 
      s.st_email, 
      COUNT(f.food_id) AS total_donated_portions
    FROM student s
    JOIN cook c ON s.st_id = c.cook_st_id
    JOIN food f ON c.cook_id = f.food_cook_id
    WHERE LOWER(f.food_status) = 'finished'
    GROUP BY s.st_id, s.st_name, s.st_surname, s.st_email
    ORDER BY total_donated_portions DESC
    LIMIT 1;
  `;
  const [rows] = await pool.query(query);

  if (!rows || rows.length === 0) return null;

  return {
    ...rows[0],
    total_donated_portions: Number(rows[0].total_donated_portions)
  };
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



app.get('/api/student/:id', async (req, res) => {
    const identifier = req.params.id;
    try {
        // Ψάχνει είτε με st_id είτε με cook_id
        const [rows] = await pool.execute(`
            SELECT s.st_id, s.st_name, s.st_surname, s.st_university, s.st_points, c.cook_id
            FROM student s
            LEFT JOIN cook c ON s.st_id = c.cook_st_id
            WHERE s.st_id = ? OR c.cook_id = ?
        `, [identifier, identifier]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Ο φοιτητής δεν βρέθηκε." });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Σφάλμα ανάκτησης πόντων:", error);
        res.status(500).json({ message: "Σφάλμα διακομιστή." });
    }
});






app.listen(PORT, () => {
    console.log(`Ο Server του UniBite τρέχει στο http://localhost:${PORT}`);
});