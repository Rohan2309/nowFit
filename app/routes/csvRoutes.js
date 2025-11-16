
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/upload', upload.single('file'), async (req,res)=>{
  // parse CSV and insert - stub
  return res.json({ success:true, file: req.file });
});
module.exports = router;
