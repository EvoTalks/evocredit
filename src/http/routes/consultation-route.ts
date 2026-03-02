import { Router } from 'express';
import { createConsultationController } from '../controllers/create-consultation-controller';
import { listConsultationsController } from '../controllers/list-consultations-controller';
import { getConsultationResultController } from '../controllers/get-consultation-result-controller';

const consultationRoute = Router();

consultationRoute.post('/consultations', createConsultationController);
consultationRoute.get('/consultations', listConsultationsController);
consultationRoute.get('/consultations/:id/result', getConsultationResultController);

export default consultationRoute;
