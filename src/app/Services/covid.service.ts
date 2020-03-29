import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class COVIDService {

  constructor(private http:HttpClient) { }

  public getCOVIDData(){
    return this.http.get('https://coronavirus-19-api.herokuapp.com/countries');
  }
}
