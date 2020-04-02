import { Component, OnInit, ViewChild } from '@angular/core';
import { COVIDService } from './Services/covid.service';
import { ICOVID } from './Common/Models/COVID';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
declare var Chart;


interface IBarChartItem {
  label: string,
  data: number[],
  backgroundColor: string,
  borderWidth: number
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  displayedColumns: string[] = ['country', 'cases', 'todayCases', 'deaths', 'todayDeaths', 'recovered', 'active'];
  dataSource: MatTableDataSource<ICOVID>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  COVIDData: ICOVID[];
  countriesLabels: string[] = [];
  currenCountryIndex = 0;
  selectedCountries: ICOVID[] = [];

  pieChartLabels: string[] = ['Cases', 'Today Cases', 'Deaths', 'Today Deaths', 'Recovered', 'Active', 'Critical', 'Cases per one Million', 'Deaths per one Million'];
  barChartLabels: string[] = ['Cases', 'Today Cases', 'Deaths', 'Today Deaths', 'Recovered', 'Active'];
  barDataSets: IBarChartItem[] = [];
  pieDataSets: number[] = Array(9).fill(0);
  barChart: any;
  pieChart: any;
 

  constructor(private COVIDService: COVIDService) {

  }
  ngOnInit(): void {
    this.getCOVIDData(false);
    setInterval(() => this.getCOVIDData(false), 180000);
  }

  private getCOVIDData(destroy: boolean) {
    this.COVIDService.getCOVIDData().subscribe((result: ICOVID[]) => {
      this.COVIDData = result;
      this.COVIDData.sort((a, b) => b.cases - a.cases)
      this.dataSource = new MatTableDataSource(this.COVIDData);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.getNextCountries(destroy,false);
    })
  }

  rendercharts(destroy: boolean) {
    let barCanvas: any;
    let pieCanvas: any;
debugger
    if(!barCanvas)
      barCanvas = document.getElementById('barChart');
    if(!pieCanvas)
      pieCanvas = document.getElementById('pieChart');

    if (destroy || this.barChart ==undefined || this.pieChart==undefined) {
      if (this.barChart)
        this.barChart.destroy();

      if (this.pieChart)
        this.pieChart.destroy();

      barCanvas = document.querySelector('.bar-chart');
      barCanvas.innerHTML = ` <canvas id="barChart" style="width: 100%;height: 500px;margin-bottom: 20px; display:block;"></canvas>`;
      barCanvas = document.getElementById('barChart');

      pieCanvas = document.querySelector('.pie-chart');
      pieCanvas.innerHTML = ` <canvas id="pieChart" style="width: 100%;height: 500px;margin-bottom: 20px; padding-left: 40px; display:block;"></canvas>`;
      pieCanvas = document.getElementById('pieChart');

    let barCtx = barCanvas.getContext('2d');
    let pieCtx = pieCanvas.getContext('2d');

    this.barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: this.barChartLabels,
        datasets: this.barDataSets
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        responsive: false
      }
    });

    this.pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: this.pieChartLabels,
        datasets: [{
          data: this.pieDataSets,
          backgroundColor: this.getRandomchartColor(9),
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        legend: {
          position: 'right'
        }
      }
    });
  }
    else{
      // update charts datasets
      this.pieChart.data.datasets[0].data=this.pieDataSets;
      this.barChart.data.datasets=this.barDataSets;
      this.pieChart.update();
      this.barChart.update();
    }
  }

  updateChartItems(COVIDCountries: ICOVID[],destroyCharts:boolean) {
    this.pieDataSets = Array(9).fill(0);
    this.countriesLabels = [];
    this.barDataSets = [];
    COVIDCountries.forEach(item => {
      this.countriesLabels.push(item.country);
      this.pieDataSets[0] += item.cases;
      this.pieDataSets[1] += item.todayCases;
      this.pieDataSets[2] += item.deaths;
      this.pieDataSets[3] += item.todayDeaths;
      this.pieDataSets[4] += item.recovered;
      this.pieDataSets[5] += item.active;
      this.pieDataSets[6] += item.critical;
      this.pieDataSets[7] += item.casesPerOneMillion;
      this.pieDataSets[8] += item.deathsPerOneMillion;

      this.barDataSets.push({
        label: item.country,
        backgroundColor: this.getRandomchartColor(1)[0],
        borderWidth: 1,
        data: [item.cases,
        item.todayCases,
        item.deaths,
        item.todayDeaths,
        item.recovered,
        item.active,
        item.critical]
      });
    });
    this.rendercharts(destroyCharts);
  }

  getRandomchartColor(count): string[] {
    const chartColors: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
      chartColors.push(randomColor);

    }
    return chartColors;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getNextCountries(destroyCharts:boolean,isButtonEvent:boolean) {

    //stay on the same index if not click event
    if(!isButtonEvent && this.currenCountryIndex>=6)
      this.currenCountryIndex=this.currenCountryIndex - 6;

    this.selectedCountries = [];
    for (let index = this.currenCountryIndex; index < this.COVIDData.length; index++) {
      if (index == this.currenCountryIndex + 6) {
        this.currenCountryIndex = index;
        break;
      }
      this.selectedCountries.push(this.COVIDData[index])
    }
    this.updateChartItems(this.selectedCountries,destroyCharts);
  }

  onCountryChange(country) {
    let item = this.COVIDData.find(x => x.country == country);
    this.selectedCountries = [];
    this.selectedCountries.push(item);
    this.updateChartItems(this.selectedCountries,true);
  }
}

