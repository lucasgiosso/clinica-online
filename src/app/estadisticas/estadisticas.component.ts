import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType, ChartData,registerables, Chart   } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import { LoadingComponent } from "../loading/loading.component";
import { FocusDirective } from '../validadores/focus.directive';
import { ResaltarDirective } from '../validadores/resaltar.directive';

Chart.register(...registerables);

@Component({
    selector: 'app-estadisticas',
    standalone: true,
    templateUrl: './estadisticas.component.html',
    styleUrl: './estadisticas.component.css',
    imports: [CommonModule, FormsModule, BaseChartDirective, LoadingComponent,FocusDirective, ResaltarDirective]
})
export class EstadisticasComponent implements OnInit{

  logIngresos: any[] = [];
  turnosPorEspecialidad: any = {};
  turnosPorDia: any = {};
  turnosSolicitadosPorMedico: any[] = [];
  turnosSolicitadosPorMedicoXFecha: { [key: string]: any } = {};
  turnosFinalizadosPorMedico: any[] = [];
  turnosFinalizadosPorMedicoXFecha: { [key: string]: any } = {};
  btnVolver = 'Volver a home';
  fechaInicio: Date = new Date('2024-01-01'); 
  fechaFin: Date = new Date('2024-12-31');
  fechaInicioS: string = '2024-01-01'; 
  fechaFinS: string = '2024-12-31';
  fechaInicioF: string = '2024-01-01'; 
  fechaFinF: string = '2024-12-31';

  public pieChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
    }
  };
  public pieChartLabels: string[] = [];
  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    
    datasets: [
      {
        data: []
      }
    ]
  };
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];



  public pieChartOptionsXEspecialidad: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
    }
  };
  public pieChartLabelsXEspecialidad: string[] = [];
  public pieChartDataXEspecialidad: ChartData<'pie'> = {
    labels: this.pieChartLabelsXEspecialidad,
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  public pieChartTypeXEspecialidad: ChartType = 'pie';
  public pieChartLegendXEspecialidad = true;
  public pieChartPluginsXEspecialidad = [];


  public pieChartOptionsXDia: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
    }
  };

  public pieChartLabelsXDia: string[] = [];
  public pieChartDataXDia: ChartData<'pie'> = {
    labels: this.pieChartLabelsXDia,
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  public pieChartTypeXDia: ChartType = 'pie';
  public pieChartLegendXDia = true;
  public pieChartPluginsXDia = [];

  public pieChartOptionsXSolicitado: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
    }
  };

  public pieChartLabelsXSolicitado: string[] = [];
  public pieChartDataXSolicitado: ChartData<'pie'> = {
    labels: this.pieChartLabelsXSolicitado,
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  public pieChartTypeXSolicitado: ChartType = 'pie';
  public pieChartLegendXSolicitado = true;
  public pieChartPluginsXSolicitado = [];

  public pieChartOptionsXFinalizado: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
    }
  };

  public pieChartLabelsXFinalizado: string[] = [];
  public pieChartDataXFinalizado: ChartData<'pie'> = {
    labels: this.pieChartLabelsXFinalizado,
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  public pieChartTypeXFinalizado: ChartType = 'pie';
  public pieChartLegendXFinalizado = true;
  public pieChartPluginsXFinalizado = [];

  showLoading: boolean = true;
  animate = false;


  constructor(private dataService: DataService, private router: Router)
  {
    
  }

  ngOnInit(): void {
    
    this.fetchLogIngresos();
    this.fetchTurnosPorEspecialidad();
    this.fetchTurnosPorDia();
    this.fetchTurnosSolicitadosPorMedico();
    this.fetchTurnosFinalizadosPorMedico();

    setTimeout(() => {
      this.showLoading = false;
      this.animate = true; 
    }, 2000);
    
  }

  public onClickHome(event: any): void 
  {
    this.router.navigate(['home']);
  }

  fetchLogIngresos() {
    this.dataService.getLogIngresos().subscribe(data => {
      this.logIngresos = data;
      //console.log('Log de ingresos:', this.logIngresos);
      this.processLogData();
    });
  }

  processLogData() {
    const usuarioCounts: { [key: string]: number } = {};

    this.logIngresos.forEach(log => {
      if (usuarioCounts[log.Usuario]) {
        usuarioCounts[log.Usuario]++;
      } else {
        usuarioCounts[log.Usuario] = 1;
      }
    });

    this.pieChartLabels = Object.keys(usuarioCounts);
    this.pieChartData = {
      labels: this.pieChartLabels,
      datasets: [
        {
          data: Object.values(usuarioCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], 
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }
      ]
    };
  }

  exportToExcel() {
    const formattedData = this.logIngresos.map(log => ({
      Usuario: log.Usuario,
      Fecha: log.Fecha,
      Hora: log.Hora
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'LogIngresos': worksheet },
      SheetNames: ['LogIngresos']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'log_ingresos');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    saveAs(data, `${fileName}_${formattedDate}.xlsx`);
  }

  generarPDF() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();
  
    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);
  
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Log de Ingresos al Sistema', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
  
      if (!this.logIngresos || this.logIngresos.length === 0) {
        console.error('No hay registros de log disponibles');
        return;
      }
  
      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;
  
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles del Log', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;
  
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
  
      this.logIngresos.forEach(log => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }
        
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;
  
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Usuario: ${log.Usuario}`, 10, y);
        y += 10;
        doc.text(`Fecha: ${log.Fecha}`, 10, y);
        y += 10;
        doc.text(`Hora: ${log.Hora}`, 10, y);
        y += 5;
  
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
  
      doc.save('log_ingresos.pdf');
    };
  }

  fetchTurnosPorEspecialidad() {
    this.dataService.getTurnosPorEspecialidad().subscribe(data => {
      this.turnosPorEspecialidad = data;
      //console.log('Turnos por especialidad:', this.turnosPorEspecialidad);
      this.processTurnosEspecialidadData();
    });
  }

  processTurnosEspecialidadData() {
    const especialidadCounts: { [key: string]: number } = this.turnosPorEspecialidad;

    this.pieChartLabelsXEspecialidad = Object.keys(especialidadCounts);
    this.pieChartDataXEspecialidad = {
      labels: this.pieChartLabelsXEspecialidad,
      datasets: [
        {
          data: Object.values(especialidadCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }
      ]
    };
  }

  exportToExcelTurnoXEspecialidad() {
    const formattedData = Object.keys(this.turnosPorEspecialidad).map(key => ({
      Especialidad: key,
      Cantidad: this.turnosPorEspecialidad[key]
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'TurnosPorEspecialidad': worksheet },
      SheetNames: ['TurnosPorEspecialidad']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'turnos_por_especialidad');
  }

  generarPDFTurnoXEspecialidad() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Reporte de Turnos por Especialidad', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      if (!this.turnosPorEspecialidad || Object.keys(this.turnosPorEspecialidad).length === 0) {
        console.error('No hay datos de turnos disponibles');
        return;
      }

      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles de Turnos por Especialidad', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");

      Object.keys(this.turnosPorEspecialidad).forEach(especialidad => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }

        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Especialidad: ${especialidad}`, 10, y);
        y += 10;
        doc.text(`Cantidad: ${this.turnosPorEspecialidad[especialidad]}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save('turnos_por_especialidad.pdf');
    };
  }
  
  fetchTurnosPorDia() {
    this.dataService.getTurnosPorDia().subscribe(data => {
      this.turnosPorDia = data;
      //console.log('Turnos por día:', this.turnosPorDia);
      this.processTurnosPorDiaData();
    });
  }

  processTurnosPorDiaData() {
    const diaCounts: { [key: string]: number } = this.turnosPorDia;

    this.pieChartLabelsXDia = Object.keys(diaCounts);
    this.pieChartDataXDia = {
      labels: this.pieChartLabelsXDia,
      datasets: [
        {
          data: Object.values(diaCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }
      ]
    };
  }

  exportToExcelXDia() {
    const formattedData = Object.keys(this.turnosPorDia).map(key => ({
      Fecha: key,
      Cantidad: this.turnosPorDia[key]
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'TurnosPorDia': worksheet },
      SheetNames: ['TurnosPorDia']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFileXDia(excelBuffer, 'turnos_por_dia');
  }

  private saveAsExcelFileXDia(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    saveAs(data, `${fileName}_${formattedDate}.xlsx`);
  }

  generarPDFXDia() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Reporte de Turnos por Día', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      if (!this.turnosPorDia || Object.keys(this.turnosPorDia).length === 0) {
        console.error('No hay datos de turnos disponibles');
        return;
      }

      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles de Turnos por Día', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");

      Object.keys(this.turnosPorDia).forEach(fecha => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }

        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${fecha}`, 10, y);
        y += 10;
        doc.text(`Cantidad: ${this.turnosPorDia[fecha]}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save('turnos_por_dia.pdf');
    };
  }


  fetchTurnosSolicitadosPorMedico() {
    if (this.fechaInicio && this.fechaFin) {
      this.dataService.getTurnosSolicitadosPorMedicos(this.fechaInicio, this.fechaFin).subscribe(data => {
        this.turnosSolicitadosPorMedico = data;
        this.processTurnosXSolicitado();
        // console.log('Turnos solicitados por médicos:', this.turnosSolicitadosPorMedico);
      });
    }
  }

  fetchTurnosSolicitadosPorMedicosXFecha(fechaInicio: string, fechaFin: string) {

    // console.log('Raw Fecha Inicio:', fechaInicio);
    // console.log('Raw Fecha Fin:', fechaFin);

    const start = new Date(fechaInicio);
    start.setUTCHours(0, 0, 0, 0); 
    const end = new Date(fechaFin);
    end.setUTCHours(23, 59, 59, 999);

    if (start > end) {
      Swal.fire({
          icon: 'error',
          title: 'Fecha inválida',
          text: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
          confirmButtonText: 'OK'
      });
      return;
  }
  
    // console.log('Start date:', start);
    // console.log('End date:', end);
  
    this.dataService.getTurnosSolicitadosPorMedicosXFecha(start, end).subscribe((data: { [key: string]: any }) => {
        this.turnosSolicitadosPorMedico = Object.keys(data).map(key => ({
            nombre: data[key].nombre,
            cantidad: data[key].cantidad
        }));
        // console.log('Turnos solicitados por médico x fecha:', this.turnosSolicitadosPorMedico);
        this.updateChart();
    });
}

  updateChart() {
    const medicoCounts: { nombre: string, cantidad: number }[] = this.turnosSolicitadosPorMedico;
  
    this.pieChartLabelsXSolicitado = medicoCounts.map((entry: { nombre: string }) => entry.nombre);
    this.pieChartDataXSolicitado = {
      labels: this.pieChartLabelsXSolicitado,
      datasets: [
        {
          data: medicoCounts.map((entry: { cantidad: number }) => entry.cantidad),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }
      ]
    };
  }

  processTurnosXSolicitado() {
    const medicoCounts: { [key: string]: any } = this.turnosSolicitadosPorMedico;

  this.pieChartLabelsXSolicitado = Object.keys(medicoCounts).map(key => medicoCounts[key].nombre);
  this.pieChartDataXSolicitado = {
    labels: this.pieChartLabelsXSolicitado,
    datasets: [
      {
        data: Object.keys(medicoCounts).map(key => medicoCounts[key].cantidad),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  }

  exportToExcelXSolicitado() {
    const formattedData = this.turnosSolicitadosPorMedico.map(item => ({
      Médico: item.nombre,
      Cantidad: item.cantidad
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'TurnosSolicitadoPorMedico': worksheet },
      SheetNames: ['TurnosSolicitadoPorMedico']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFileXSolicitado(excelBuffer, 'turnos_solicitado_por_medico');
  }

  private saveAsExcelFileXSolicitado(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    saveAs(data, `${fileName}_${formattedDate}.xlsx`);
  }

  generarPDFXSolicitado() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Reporte de turnos solicitados por médico', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      if (!this.turnosSolicitadosPorMedico || this.turnosSolicitadosPorMedico.length === 0) {
        console.error('No hay datos de turnos disponibles');
        return;
      }

      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles de turnos solicitados por médico', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");

      this.turnosSolicitadosPorMedico.forEach(item => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }

        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Médico: ${item.nombre}`, 10, y);
        y += 10;
        doc.text(`Cantidad: ${item.cantidad}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save('turnos_solicitados_por_medico.pdf');
    };
  }
  
  fetchTurnosFinalizadosPorMedico() {
    if (this.fechaInicio && this.fechaFin) {
      this.dataService.getTurnosFinalizadosPorMedicos(this.fechaInicio, this.fechaFin).subscribe(data => {
        this.turnosFinalizadosPorMedico = data;
        this.processTurnosXFinalizado();
         //console.log('Turnos finalizados por médicos:', this.turnosSolicitadosPorMedico);
      });
    }
  }

  fetchTurnosFinalizadosPorMedicosXFecha(fechaInicio: string, fechaFin: string) {

    // console.log('Raw Fecha Inicio:', fechaInicio);
    // console.log('Raw Fecha Fin:', fechaFin);

    const start = new Date(fechaInicio);
    start.setUTCHours(0, 0, 0, 0); 
    const end = new Date(fechaFin);
    end.setUTCHours(23, 59, 59, 999);

    if (start > end) {
      Swal.fire({
          icon: 'error',
          title: 'Fecha inválida',
          text: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
          confirmButtonText: 'OK'
      });
      return;
  }
  
    // console.log('Start date:', start);
    // console.log('End date:', end);
  
    this.dataService.getTurnosFinalizadosPorMedicosXFecha(start, end).subscribe((data: { [key: string]: any }) => {
        this.turnosFinalizadosPorMedico = Object.keys(data).map(key => ({
            nombre: data[key].nombre,
            cantidad: data[key].cantidad
        }));
        // console.log('Turnos solicitados por médico x fecha:', this.turnosSolicitadosPorMedico);
        this.updateChartXFinalizados();
    });
}

  updateChartXFinalizados() {
    const medicoCounts: { nombre: string, cantidad: number }[] = this.turnosFinalizadosPorMedico;
  
    this.pieChartLabelsXFinalizado = medicoCounts.map((entry: { nombre: string }) => entry.nombre);
    this.pieChartDataXFinalizado = {
      labels: this.pieChartLabelsXSolicitado,
      datasets: [
        {
          data: medicoCounts.map((entry: { cantidad: number }) => entry.cantidad),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }
      ]
    };
  }

  processTurnosXFinalizado() {
    const medicoCounts: { [key: string]: any } = this.turnosFinalizadosPorMedico;

  this.pieChartLabelsXFinalizado = Object.keys(medicoCounts).map(key => medicoCounts[key].nombre);
  this.pieChartDataXFinalizado = {
    labels: this.pieChartLabelsXFinalizado,
    datasets: [
      {
        data: Object.keys(medicoCounts).map(key => medicoCounts[key].cantidad),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }
    ]
  };
  }

  exportToExcelXFinalizado() {
    const formattedData = this.turnosFinalizadosPorMedico.map(item => ({
      Médico: item.nombre,
      Cantidad: item.cantidad
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'TurnosFinalizadosPorMedico': worksheet },
      SheetNames: ['TurnosFinalizadosPorMedico']
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFileXFinalizado(excelBuffer, 'turnos_finalizados_por_medico');
  }

  private saveAsExcelFileXFinalizado(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    saveAs(data, `${fileName}_${formattedDate}.xlsx`);
  }

  generarPDFXFinalizado() {
    const doc = new jsPDF();
    const logo = 'assets/logo.png';
    const fechaEmision = new Date().toLocaleDateString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text('Reporte de turnos finalizados por médico', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha de emisión: ${fechaEmision}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      if (!this.turnosFinalizadosPorMedico || this.turnosFinalizadosPorMedico.length === 0) {
        console.error('No hay datos de turnos disponibles');
        return;
      }

      let y = 50;
      doc.setLineWidth(0.5);
      doc.line(10, y, 200, y);
      y += 10;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Detalles de turnos finalizados por médico', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");

      this.turnosSolicitadosPorMedico.forEach(item => {
        if (y > 270) {
          doc.addPage();
          y = 10;
        }

        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Médico: ${item.nombre}`, 10, y);
        y += 10;
        doc.text(`Cantidad: ${item.cantidad}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save('turnos_finalizados_por_medico.pdf');
    };
  }

}
