import express from 'express';
const router = express.Router();

let counter = 0;

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

export default router;
