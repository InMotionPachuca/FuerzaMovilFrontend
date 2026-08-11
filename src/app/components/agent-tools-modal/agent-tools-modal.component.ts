import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService, ToyotaModel } from '../../core/services/quote.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agent-tools-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './agent-tools-modal.component.html',
  styleUrl: './agent-tools-modal.component.css'
})
export class AgentToolsModalComponent implements OnInit {
  private quoteService = inject(QuoteService);

  @Input() client: any = null;
  @Input() activeTool: 'quote' | 'testDrive' = 'quote';
  @Output() closeModal = new EventEmitter<void>();

  models: ToyotaModel[] = [];

  // Formulario Cotizador
  selectedModelId: string = '';
  downPaymentPercent: number = 20;
  termMonths: number = 36;
  annualInterestRate: number = 13.5;

  // Formulario Test Drive
  testDrive = {
    date: new Date().toISOString().slice(0, 10),
    time: '11:00',
    modelId: '',
    routeType: 'Urbana (Zona Galerías Pachuca)'
  };

  ngOnInit(): void {
    this.models = this.quoteService.models || [];
    if (this.models.length > 0) {
      this.selectedModelId = this.models[0].id;
      this.testDrive.modelId = this.models[0].id;
    }
  }

  selectTool(tool: 'quote' | 'testDrive'): void {
    this.activeTool = tool;
  }

  closeOnBackdrop(event: MouseEvent): void {
    this.closeModal.emit();
  }

  get currentQuote() {
    return this.quoteService.calculateQuote({
      modelId: this.selectedModelId,
      downPaymentPercent: Number(this.downPaymentPercent),
      termMonths: Number(this.termMonths),
      annualInterestRate: Number(this.annualInterestRate)
    });
  }

  // ENVÍO A WHATSAPP SIN ERROR 403 (USANDO LA API UNIVERSAL DE WHATSAPP)
  sendQuoteWhatsApp(): void {
    if (!this.client?.contactPhone) {
      Swal.fire('Atención', 'El cliente no tiene un teléfono registrado.', 'warning');
      return;
    }

    // 1. Limpieza estricta del número telefónico (remueve lada 01, guiones y paréntesis)
    let cleanPhone = String(this.client.contactPhone).replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = cleanPhone.substring(2);
    }
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone; // Lada de México
    }

    const q = this.currentQuote;
    const clientName = this.client.companyName || this.client.nombreDelCliente || 'Estimado cliente';

    const messageText = 
      `Hola ${clientName}, le comparto la cotización solicitada de *Toyota Pachuca*:\n\n` +
      `🚗 *Vehículo:* ${q.modelName}\n` +
      `💵 *Precio de Lista:* $${q.totalPrice.toLocaleString('es-MX')} MXN\n` +
      `💰 *Enganche (${this.downPaymentPercent}%):* $${q.downPayment.toLocaleString('es-MX')} MXN\n` +
      `📅 *Plazo:* ${q.termMonths} meses\n` +
      `💳 *Mensualidad Estimada:* *$${q.monthlyPayment.toLocaleString('es-MX')} MXN*\n\n` +
      `¿Le gustaría agendar una prueba de manejo hoy mismo?`;

    const encoded = encodeURIComponent(messageText);

    // 2. URL oficial de la API de WhatsApp para evitar el error 403 de web.whatsapp.com
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }

  scheduleTestDrive(): void {
    const selectedModel = this.models.find(m => m.id === this.testDrive.modelId)?.name || 'Unidad Demo';
    
    Swal.fire({
      icon: 'success',
      title: '¡Prueba de Manejo Programada!',
      text: `Cita registrada para ${this.client?.companyName || 'Cliente'} el ${this.testDrive.date} a las ${this.testDrive.time} hrs (${selectedModel}).`,
      confirmButtonColor: '#EB0A1E'
    });

    this.closeModal.emit();
  }
}