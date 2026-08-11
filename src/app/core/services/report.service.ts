import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  exportToExcel(data: any[], fileName: string = 'Reporte_FuerzaMovil'): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { 
      Sheets: { 'Datos': worksheet }, 
      SheetNames: ['Datos'] 
    };
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  generateAgentPerformanceReport(agents: any[]): void {
    const reportData = agents.map(agent => ({
      'ID Asesor': agent.id,
      'Nombre Completo': agent.fullName,
      'Usuario / Correo': agent.username,
      'Clientes Asignados': agent.assignedClientsCount || 0,
      'Seguimientos Registrados': agent.completedFollowUpsCount || 0,
      '% Productividad': '70%'
    }));

    this.exportToExcel(reportData, 'Reporte_Desempenio_Asesores');
  }
}