import { Router, type IRouter } from "express";
import healthRouter from "./health";
import housingRouter from "./housing";
import starbucksRouter from "./starbucks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(housingRouter);
router.use(starbucksRouter);

export default router;
