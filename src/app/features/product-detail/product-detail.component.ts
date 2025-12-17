import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Instrument } from '../../core/models/instrument.model';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  instrument: Instrument | null = null;
  relatedInstruments: Instrument[] = [];
  loading = true;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadProduct(id);
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.api.getInstrument(id).subscribe({
      next: instrument => {
        this.instrument = instrument;
        this.loadRelated(instrument.category, id);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Produit non trouvé', 'error');
      }
    });
  }

  loadRelated(category: string, currentId: number): void {
    this.api.getInstruments().subscribe({
      next: instruments => {
        this.relatedInstruments = instruments
          .filter(i => i.category === category && i.id !== currentId)
          .slice(0, 4);
      }
    });
  }

  addToCart(): void {
    if (!this.instrument) return;
    for (let i = 0; i < this.quantity; i++) {
      this.cart.addToCart(this.instrument);
    }
    Swal.fire({
      title: 'Succès!',
      text: `${this.quantity}x ${this.instrument.name} ajouté au panier`,
      icon: 'success',
      timer: 2000,
      confirmButtonColor: '#667eea'
    });
    this.quantity = 1;
  }

  increaseQty(): void {
    if (this.instrument && this.quantity < this.instrument.stock) {
      this.quantity++;
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}