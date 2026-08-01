import express from "express";
import { addKeyword, deleteKeyword, getKeyword, getKeywords, refreshKeyword, toggleTracking } from "../controllers/rankController.js";
import auth from "../middleware/auth.js";

const rankRouter = express.Router();

rankRouter.post('/add', auth, addKeyword);
rankRouter.get('/list', auth, getKeywords);
rankRouter.get('/:id', auth, getKeyword);
rankRouter.post('/:id/refresh', auth, refreshKeyword);
rankRouter.put('/:id/toggle', auth, toggleTracking);
rankRouter.detelet('/:id', auth, deleteKeyword);

export default rankRouter;