import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Instrument } from '../../core/models/instrument.model';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: Instrument[] = [];
  total = 0;

  constructor(
    private cartService: CartService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    this.total = this.cartService.getCartTotal();
  }

  addToCart(instrument: Instrument): void {
    this.cartService.addToCart(instrument);
  }

  removeItem(id: number): void {
    Swal.fire({
      title: 'Supprimer du panier?',
      text: 'Tous les exemplaires de cet article seront retirés.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#999',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(id);
        Swal.fire({
          title: 'Supprimé!',
          text: 'Article retiré du panier',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  removeOneItem(id: number): void {
    this.cartService.removeOneItem(id);
  }

  clearCart(): void {
    Swal.fire({
      title: 'Vider le panier?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#999',
      confirmButtonText: 'Oui, vider',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
        Swal.fire({
          title: 'Panier vide!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  checkout(): void {
    const uniqueItems = this.getUniqueInstruments();
    
    // First, fetch fresh data for all instruments to get current stock
    const fetchPromises = uniqueItems.map(item => 
      this.api.getInstrument(item.instrument.id)
    );

    forkJoin(fetchPromises).subscribe({
      next: (freshInstruments) => {
        // Create update requests with decremented stock
        const updateRequests = freshInstruments.map((freshInstrument, index) => {
          const cartItem = uniqueItems[index];
          const newStock = freshInstrument.stock - cartItem.count;
          
          // Check if we have enough stock
          if (newStock < 0) {
            throw new Error(`Stock insuffisant pour ${freshInstrument.name}`);
          }
          
          return this.api.updateInstrument(freshInstrument.id, { 
            ...freshInstrument,
            stock: newStock 
          });
        });

        // Execute all updates
        forkJoin(updateRequests).subscribe({
          next: () => {
            Swal.fire({
              title: 'Commande confirmée!',
              html: `
                <p>Votre commande a été validée avec succès.</p>
                <p style="font-size: 24px; font-weight: 700; color: #667eea; margin-top: 16px;">
                  Total: ${this.total.toFixed(2)}€
                </p>
              `,
              icon: 'success',
              confirmButtonColor: '#667eea',
              confirmButtonText: 'Continuer mes achats'
            }).then(() => {
              this.cartService.clearCart();
              window.location.href = '/catalog';
            });
          },
          error: (err) => {
            Swal.fire({
              title: 'Erreur!',
              text: 'Impossible de mettre à jour le stock. Veuillez réessayer.',
              icon: 'error',
              confirmButtonColor: '#667eea'
            });
          }
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Erreur!',
          text: err.message || 'Impossible de vérifier le stock disponible.',
          icon: 'error',
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  getUniqueInstruments(): Array<{ instrument: Instrument; count: number }> {
    const unique = new Map<number, Instrument>();
    const counts = new Map<number, number>();

    this.cartItems.forEach(item => {
      unique.set(item.id, item);
      counts.set(item.id, (counts.get(item.id) || 0) + 1);
    });

    return Array.from(unique.values()).map(instrument => ({
      instrument,
      count: counts.get(instrument.id) || 0
    }));
  }
}