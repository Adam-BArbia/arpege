import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Instrument } from '../../core/models/instrument.model';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {
  instruments: Instrument[] = [];
  filteredInstruments: Instrument[] = [];
  loading = false;

  searchTerm = '';
  selectedCategory = '';
  categories: string[] = [];

  selectedFamily = '';
  selectedSubfamily = '';
  families: string[] = [];
  subfamilies: string[] = [];

  constructor(
    private api: ApiService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getInstruments().subscribe({
      next: data => {
        this.instruments = data;
        this.extractCategories();
        this.extractFamilies();
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  extractCategories(): void {
    this.categories = [...new Set(this.instruments.map(i => i.category))].sort();
  }

  extractFamilies(): void {
    this.families = [...new Set(this.instruments.map(i => i.family).filter(Boolean) as string[])].sort();
    this.updateSubfamilies();
  }

  updateSubfamilies(): void {
    if (!this.selectedFamily) {
      this.subfamilies = [];
      this.selectedSubfamily = '';
      return;
    }
    const subs = this.instruments
      .filter(i => i.family === this.selectedFamily && i.subfamily)
      .map(i => i.subfamily as string);
    this.subfamilies = [...new Set(subs)].sort();
    if (!this.subfamilies.includes(this.selectedSubfamily)) this.selectedSubfamily = '';
  }

  applyFilters(): void {
    let result = this.instruments;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(term) ||
        i.brand.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        (i.family || '').toLowerCase().includes(term) ||
        (i.subfamily || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      result = result.filter(i => i.category === this.selectedCategory);
    }

    if (this.selectedFamily) {
      result = result.filter(i => i.family === this.selectedFamily);
    }

    if (this.selectedSubfamily) {
      result = result.filter(i => i.subfamily === this.selectedSubfamily);
    }

    this.filteredInstruments = result;
  }

  onSearchChange(): void { this.applyFilters(); }

  onCategoryChange(): void { this.applyFilters(); }

  onFamilyChange(): void { this.updateSubfamilies(); this.applyFilters(); }

  onSubfamilyChange(): void { this.applyFilters(); }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedFamily = '';
    this.selectedSubfamily = '';
    this.updateSubfamilies();
    this.applyFilters();
  }

  addToCart(instrument: Instrument): void {
    this.cart.addToCart(instrument);
    Swal.fire({
      title: 'Succès!',
      text: `${instrument.name} ajouté au panier`,
      icon: 'success',
      timer: 2000,
      confirmButtonColor: '#667eea'
    });
  }
}