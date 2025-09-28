import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AddRideComponent } from './components/add-ride/add-ride.component';
import { SearchRidesComponent } from './components/search-rides/search-rides.component';
import { LoginComponent } from './components/login/login.component';
import { PickRideComponent } from './components/pick-ride/pick-ride.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    AddRideComponent,
    SearchRidesComponent,
    LoginComponent,
    PickRideComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
