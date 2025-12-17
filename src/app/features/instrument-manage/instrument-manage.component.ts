import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Instrument } from '../../core/models/instrument.model';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instrument-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './instrument-manage.component.html',
  styleUrl: './instrument-manage.component.css'
})
export class InstrumentManageComponent implements OnInit {
  instruments: Instrument[] = [];
  filtered: Instrument[] = [];
  loading = false;

  form!: FormGroup;
  editingId: number | null = null;

  // quick search
  q = signal('');

  // dropdown helpers
  categories: string[] = [];
  families: string[] = [];
  subfamilies: string[] = [];

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      brand: ['', [Validators.required]],
      category: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imageUrl: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      family: [''],
      subfamily: ['']
    });
    this.load();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.q.set(value);
    this.filterList();
  }

  load(): void {
    this.loading = true;
    this.api.getInstruments().subscribe({
      next: data => {
        this.instruments = data;
        this.filtered = data;
        this.categories = [...new Set(data.map(i => i.category))].sort();
        this.families = [...new Set(data.map(i => i.family).filter(Boolean) as string[])].sort();
        this.updateSubfamilies(this.form.get('family')?.value);
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        Swal.fire({
          title: 'Erreur!',
          text: 'Impossible de charger les instruments.',
          icon: 'error',
          confirmButtonColor: '#667eea'
        });
      }
    });
  }

  filterList(): void {
    const term = this.q().toLowerCase().trim();
    if (!term) {
      this.filtered = this.instruments;
      return;
    }
    this.filtered = this.instruments.filter(i =>
      [i.name, i.brand, i.category, i.family ?? '', i.subfamily ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      brand: '',
      category: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      description: '',
      family: '',
      subfamily: ''
    });
  }

  startEdit(row: Instrument): void {
    this.editingId = row.id;
    this.form.patchValue(row);
    this.updateSubfamilies(row.family);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        title: 'Validation échouée',
        text: 'Veuillez remplir tous les champs correctement.',
        icon: 'warning',
        confirmButtonColor: '#667eea'
      });
      return;
    }
    const payload = this.form.value as Omit<Instrument, 'id'>;

    if (this.editingId == null) {
      this.api.addInstrument(payload).subscribe({
        next: () => {
          Swal.fire({
            title: 'Succès!',
            text: `"${payload.name}" a été ajouté avec succès.`,
            icon: 'success',
            confirmButtonColor: '#667eea',
            timer: 2000
          });
          this.startCreate();
          this.load();
        },
        error: err => {
          Swal.fire({
            title: 'Erreur!',
            text: 'Impossible d\'ajouter l\'instrument.',
            icon: 'error',
            confirmButtonColor: '#667eea'
          });
        }
      });
    } else {
      this.api.updateInstrument(this.editingId, payload).subscribe({
        next: () => {
          Swal.fire({
            title: 'Succès!',
            text: `"${payload.name}" a été modifié avec succès.`,
            icon: 'success',
            confirmButtonColor: '#667eea',
            timer: 2000
          });
          this.startCreate();
          this.load();
        },
        error: err => {
          Swal.fire({
            title: 'Erreur!',
            text: 'Impossible de modifier l\'instrument.',
            icon: 'error',
            confirmButtonColor: '#667eea'
          });
        }
      });
    }
  }

  remove(row: Instrument): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Voulez-vous supprimer "${row.name}" ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53935',
      cancelButtonColor: '#999',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteInstrument(row.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Supprimé!',
              text: `"${row.name}" a été supprimé avec succès.`,
              icon: 'success',
              confirmButtonColor: '#667eea',
              timer: 2000
            });
            this.load();
          },
          error: err => {
            Swal.fire({
              title: 'Erreur!',
              text: 'Impossible de supprimer l\'instrument.',
              icon: 'error',
              confirmButtonColor: '#667eea'
            });
          }
        });
      }
    });
  }

  updateSubfamilies(family: string | null | undefined): void {
    if (!family) {
      this.subfamilies = [];
      return;
    }
    const subs = this.instruments
      .filter(i => i.family === family && i.subfamily)
      .map(i => i.subfamily as string);
    this.subfamilies = [...new Set(subs)].sort();
  }

  onFamilyChange(): void {
    const fam = this.form.get('family')?.value as string;
    this.updateSubfamilies(fam);
    if (!this.subfamilies.includes(this.form.get('subfamily')?.value)) {
      this.form.get('subfamily')?.setValue('');
    }
  }
}