import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, from } from 'rxjs';
import { finalize, map, switchMap, filter, take } from 'rxjs/operators';
import { ImagenTv, HorarioImagen, DiaSemana } from '../models/imagen.model';

@Injectable({
  providedIn: 'root',
})
export class ImagenService {
  private collection = 'imagenes';
  private storagePath = 'imagenes';

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  // Obtener todas las imágenes del sistema
  getAllImagenes(): Observable<ImagenTv[]> {
    return this.firestore
      .collection<ImagenTv>(this.collection)
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as ImagenTv;
            return { ...data, id: a.payload.doc.id };
          }).sort((a, b) => {
            // Ordenar por fechaCreacion descendente
            return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
          })
        )
      );
  }

  // Obtener todas las imágenes de un TV
  getImagenesByTelevisor(televisorId: string): Observable<ImagenTv[]> {
    return this.firestore
      .collection<ImagenTv>(this.collection, ref => 
        ref.where('televisorId', '==', televisorId)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as ImagenTv;
            return { ...data, id: a.payload.doc.id };
          }).sort((a, b) => {
            // Ordenar por fechaCreacion descendente en el cliente
            return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
          })
        )
      );
  }

  // Subir una nueva imagen
  uploadImagen(
    file: File,
    televisorId: string,
    nombre: string,
    clienteId?: string
  ): Observable<ImagenTv> {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${this.storagePath}/${televisorId}/${fileName}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    console.log('🔄 Iniciando upload de imagen:', fileName);
    console.log('📁 Ruta del archivo:', filePath);

    return uploadTask.snapshotChanges().pipe(
      finalize(() => {
        console.log('✅ Upload task finalizado');
      }),
      filter(snapshot => snapshot !== null && snapshot !== undefined && snapshot.state === 'success'),
      take(1),
      switchMap(() => {
        console.log('🔗 Upload completado exitosamente, obteniendo URL...');
        // Usar directamente el fileRef para obtener la URL
        return fileRef.getDownloadURL();
      }),
      switchMap(downloadURL => {
        console.log('✅ URL de descarga obtenida:', downloadURL);
        const imageData: Omit<ImagenTv, 'id'> = {
          nombre,
          url: downloadURL,
          televisorId,
          clienteId: clienteId,
          fechaCreacion: new Date(),
          horarios: []
        };

        console.log('💾 Guardando datos en Firestore:', imageData);
        return from(this.firestore.collection(this.collection).add(imageData)).pipe(
          map((docRef) => {
            const newImage = {
              id: docRef.id,
              ...imageData
            };
            console.log('✅ Imagen guardada completamente:', newImage);
            return newImage;
          })
        );
      })
    );
  }

  // Actualizar horarios de una imagen
  updateHorarios(
    imagenId: string,
    horarios: HorarioImagen[]
  ): Observable<void> {
    return from(this.firestore.collection(this.collection).doc(imagenId).update({ horarios }));
  }

  // Eliminar una imagen
  deleteImagen(imagen: ImagenTv): Observable<void> {
    // Eliminar archivo de Storage
    const fileRef = this.storage.refFromURL(imagen.url);
    
    return from(fileRef.delete()).pipe(
      switchMap(() => 
        from(this.firestore.collection(this.collection).doc(imagen.id).delete())
      )
    );
  }

  // Agregar horario a una imagen
  agregarHorario(imagenId: string, horario: Omit<HorarioImagen, 'id'>): Observable<void> {
    console.log('🔥 SERVICIO: agregarHorario llamado');
    console.log('🔥 SERVICIO: imagenId:', imagenId);
    console.log('🔥 SERVICIO: horario recibido:', horario);
    
    const nuevoHorario: HorarioImagen = {
      id: this.firestore.createId(),
      ...horario
    };

    console.log('🔥 SERVICIO: nuevoHorario creado:', nuevoHorario);

    return this.firestore.collection(this.collection).doc(imagenId).get().pipe(
      switchMap(doc => {
        console.log('🔥 SERVICIO: documento existe:', doc.exists);
        if (doc.exists) {
          const data = doc.data() as ImagenTv;
          console.log('🔥 SERVICIO: datos actuales de la imagen:', data);
          console.log('🔥 SERVICIO: horarios actuales:', data.horarios);
          
          const horariosActualizados = [...(data.horarios || []), nuevoHorario];
          console.log('🔥 SERVICIO: horarios actualizados:', horariosActualizados);
          
          console.log('🔥 SERVICIO: actualizando documento...');
          return from(doc.ref.update({ horarios: horariosActualizados })).pipe(
            map(() => {
              console.log('🔥 SERVICIO: ✅ Documento actualizado exitosamente');
            })
          );
        }
        console.log('🔥 SERVICIO: ❌ Imagen no encontrada');
        throw new Error('Imagen no encontrada');
      })
    );
  }

  // Eliminar horario de una imagen
  eliminarHorario(imagenId: string, horarioId: string): Observable<void> {
    return this.firestore.collection(this.collection).doc(imagenId).get().pipe(
      switchMap(doc => {
        if (doc.exists) {
          const data = doc.data() as ImagenTv;
          const horariosActualizados = (data.horarios || []).filter(h => h.id !== horarioId);
          return from(doc.ref.update({ horarios: horariosActualizados }));
        }
        throw new Error('Imagen no encontrada');
      })
    );
  }

  // Obtener imágenes activas para un televisor en un horario específico
  // Validar conflictos de horarios para una imagen en un televisor
  validarConflictosHorarios(
    televisorId: string, 
    nuevosHorarios: HorarioImagen[], 
    imagenIdExcluir?: string
  ): Observable<{ hasConflicts: boolean; conflicts: any[] }> {
    console.log('🔥 SERVICIO: validarConflictosHorarios iniciado');
    console.log('🔥 SERVICIO: televisorId:', televisorId);
    console.log('🔥 SERVICIO: nuevosHorarios:', nuevosHorarios);
    console.log('🔥 SERVICIO: imagenIdExcluir:', imagenIdExcluir);
    
    return this.getImagenesByTelevisor(televisorId).pipe(
      map(imagenes => {
        console.log('🔥 SERVICIO: imágenes obtenidas:', imagenes);
        const conflicts: any[] = [];
        
        // Filtrar la imagen actual si se está editando
        const imagenesAValidar = imagenIdExcluir 
          ? imagenes.filter(img => img.id !== imagenIdExcluir)
          : imagenes;

        console.log('🔥 SERVICIO: imágenes a validar:', imagenesAValidar);

        // Verificar cada nuevo horario contra los existentes
        nuevosHorarios.forEach(nuevoHorario => {
          console.log('🔥 SERVICIO: validando nuevo horario:', nuevoHorario);
          
          imagenesAValidar.forEach(imagen => {
            console.log('🔥 SERVICIO: validando contra imagen:', imagen.nombre, 'horarios:', imagen.horarios);
            
            imagen.horarios.forEach(horarioExistente => {
              console.log('🔥 SERVICIO: comparando con horario existente:', horarioExistente);
              
              // Verificar si hay días en común
              const diasEnComun = nuevoHorario.dias.some(nuevoDia => 
                horarioExistente.dias.some(diaExistente => diaExistente.value === nuevoDia.value)
              );

              console.log('🔥 SERVICIO: días en común:', diasEnComun);

              if (diasEnComun) {
                // Verificar si hay solapamiento de horarios
                const conflictoHorario = this.verificarSolapamientoHorarios(
                  nuevoHorario.horaInicio,
                  nuevoHorario.horaFin,
                  horarioExistente.horaInicio,
                  horarioExistente.horaFin
                );

                console.log('🔥 SERVICIO: conflicto de horario:', conflictoHorario);

                if (conflictoHorario) {
                  conflicts.push({
                    imagenConflicto: imagen.nombre,
                    horarioConflicto: horarioExistente,
                    diasEnComun: nuevoHorario.dias.filter(nuevoDia => 
                      horarioExistente.dias.some(diaExistente => diaExistente.value === nuevoDia.value)
                    ),
                    nuevoHorario: nuevoHorario
                  });
                }
              }
            });
          });
        });

        console.log('🔥 SERVICIO: conflictos encontrados:', conflicts);
        const resultado = {
          hasConflicts: conflicts.length > 0,
          conflicts: conflicts
        };
        console.log('🔥 SERVICIO: resultado final de validación:', resultado);
        return resultado;
      })
    );
  }

  // Verificar solapamiento entre dos rangos de horarios
  private verificarSolapamientoHorarios(
    inicio1: string, 
    fin1: string, 
    inicio2: string, 
    fin2: string
  ): boolean {
    // Convertir horarios a minutos para facilitar comparación
    const minutosInicio1 = this.convertirHoraAMinutos(inicio1);
    const minutosFin1 = this.convertirHoraAMinutos(fin1);
    const minutosInicio2 = this.convertirHoraAMinutos(inicio2);
    const minutosFin2 = this.convertirHoraAMinutos(fin2);

    // Verificar solapamiento
    return !(minutosFin1 <= minutosInicio2 || minutosFin2 <= minutosInicio1);
  }

  // Convertir hora en formato HH:MM a minutos
  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  // Obtener horarios disponibles para un día específico con fracciones de hora
  getHorariosDisponiblesPorDia(
    televisorId: string, 
    dia: number, 
    imagenIdExcluir?: string
  ): Observable<{ inicio: string; fin: string; disponible: boolean }[]> {
    return this.getImagenesByTelevisor(televisorId).pipe(
      map(imagenes => {
        // Filtrar imágenes excluyendo la imagen actual si se especifica
        const imagenesFiltradas = imagenIdExcluir 
          ? imagenes.filter(img => img.id !== imagenIdExcluir)
          : imagenes;

        // Obtener todos los horarios ocupados para el día específico
        const horariosOcupados: { inicio: string; fin: string }[] = [];
        
        imagenesFiltradas.forEach(imagen => {
          imagen.horarios.forEach(horario => {
            const tieneEseDia = horario.dias.some(d => d.value === dia);
            if (tieneEseDia) {
              horariosOcupados.push({
                inicio: horario.horaInicio,
                fin: horario.horaFin
              });
            }
          });
        });

        // Generar todos los intervalos posibles de 15 minutos (00:00 a 23:45)
        const intervalos: { inicio: string; fin: string; disponible: boolean }[] = [];
        
        for (let hora = 0; hora < 24; hora++) {
          for (let minuto = 0; minuto < 60; minuto += 15) {
            const horaInicio = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            // Calcular hora fin (15 minutos después)
            let horaFin = hora;
            let minutoFin = minuto + 15;
            
            if (minutoFin >= 60) {
              minutoFin = 0;
              horaFin++;
            }
            
            // Si llegamos a las 24:00, no agregar más intervalos
            if (horaFin >= 24) break;
            
            const horaFinStr = `${horaFin.toString().padStart(2, '0')}:${minutoFin.toString().padStart(2, '0')}`;
            
            // Verificar si este intervalo está disponible
            const disponible = !this.verificarConflictoConHorarios(horaInicio, horaFinStr, horariosOcupados);
            
            intervalos.push({
              inicio: horaInicio,
              fin: horaFinStr,
              disponible
            });
          }
        }

        return intervalos;
      })
    );
  }

  // Verificar si un horario tiene conflicto con una lista de horarios ocupados
  private verificarConflictoConHorarios(
    inicioNuevo: string, 
    finNuevo: string, 
    horariosOcupados: { inicio: string; fin: string }[]
  ): boolean {
    return horariosOcupados.some(horario => 
      this.verificarSolapamientoHorarios(inicioNuevo, finNuevo, horario.inicio, horario.fin)
    );
  }

  // Método para obtener imágenes activas en un horario específico
  getImagenesActivasEnHorario(televisorId: string, fecha: Date = new Date()): Observable<ImagenTv[]> {
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const horaActual = fecha.toTimeString().slice(0, 5); // HH:MM

    return this.getImagenesByTelevisor(televisorId).pipe(
      map(imagenes => 
        imagenes.filter(imagen => {
          // Si no tiene horarios, se muestra 24/7
          if (!imagen.horarios || imagen.horarios.length === 0) {
            return true;
          }

          // Verificar si algún horario coincide con el momento actual
          return imagen.horarios.some(horario => {
            const tieneDia = horario.dias.some(dia => dia.value === diaSemana);
            const estaEnHorario = horaActual >= horario.horaInicio && horaActual <= horario.horaFin;
            return tieneDia && estaEnHorario;
          });
        })
      )
    );
  }

  // Días de la semana predefinidos
  getDiasSemana(): DiaSemana[] {
    return [
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' },
      { value: 0, label: 'Domingo' }
    ];
  }
}
