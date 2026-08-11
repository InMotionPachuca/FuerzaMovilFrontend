import { Injectable } from '@angular/core';

export interface ToyotaModel {
  id: string;
  name: string;
  price: number;
  imageIcon: string;
}

export interface QuoteRequest {
  modelId: string;
  downPaymentPercent: number;
  termMonths: number;
  annualInterestRate: number; // Ej. 13.5%
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  
  readonly models: ToyotaModel[] = [
    { id: 'yaris', name: 'Toyota Yaris Sedan', price: 312800, imageIcon: 'bi-car-front-fill' },
    { id: 'corolla', name: 'Toyota Corolla', price: 419900, imageIcon: 'bi-car-front-fill' },
    { id: 'rav4', name: 'Toyota RAV4 Hybrid', price: 579400, imageIcon: 'bi-truck-front-fill' },
    { id: 'hilux', name: 'Toyota Hilux Doble Cabina', price: 498500, imageIcon: 'bi-truck' },
    { id: 'tacoma', name: 'Toyota Tacoma 4x4', price: 769900, imageIcon: 'bi-truck' },
    { id: 'avanza', name: 'Toyota Avanza', price: 351400, imageIcon: 'bi-car-front' }
  ];

  calculateQuote(req: QuoteRequest) {
    const selectedModel = this.models.find(m => m.id === req.modelId) || this.models[0];
    const downPayment = (selectedModel.price * req.downPaymentPercent) / 100;
    const amountToFinance = selectedModel.price - downPayment;

    // Cálculo de tasa de interés mensual
    const monthlyRate = (req.annualInterestRate / 100) / 12;
    const monthlyPayment = (amountToFinance * monthlyRate * Math.pow(1 + monthlyRate, req.termMonths)) / 
                           (Math.pow(1 + monthlyRate, req.termMonths) - 1);

    return {
      modelName: selectedModel.name,
      totalPrice: selectedModel.price,
      downPayment: Math.round(downPayment),
      amountToFinance: Math.round(amountToFinance),
      termMonths: req.termMonths,
      monthlyPayment: Math.round(monthlyPayment)
    };
  }
}