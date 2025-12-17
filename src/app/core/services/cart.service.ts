import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Instrument } from '../models/instrument.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: Instrument[] = [];
  private cartSubject = new BehaviorSubject<Instrument[]>([]);

  cart$: Observable<Instrument[]> = this.cartSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  addToCart(instrument: Instrument): void {
    this.cartItems.push(instrument);
    this.updateCart();
  }

  removeFromCart(id: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
    this.updateCart();
  }

  removeOneItem(id: number): void {
    const index = this.cartItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.updateCart();
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  getCart(): Instrument[] {
    return this.cartItems;
  }

  getCartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  }

  getCartCount(): number {
    return this.cartItems.length;
  }

  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  private loadCart(): void {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        this.cartItems = JSON.parse(stored);
        this.cartSubject.next([...this.cartItems]);
      } catch (e) {
        this.cartItems = [];
      }
    }
  }
}