# PatitasEnCasAPP

Proyecto móvil/web creado con Ionic + Angular que utiliza Firebase (Firestore, Storage y Auth).

## Diagrama de arquitectura

La arquitectura del sistema (VPC multiaz, Load Balancer, Auto Scaling Groups, Storage/CDN, Observabilidad y entorno de staging) está disponible en `docs/architecture.svg` y se renderiza automáticamente a `docs/architecture.png` mediante un workflow de GitHub Actions.

![Arquitectura de la aplicación](docs/architecture.svg)

## Infraestructura (Terraform)

Hay un esqueleto Terraform en `terraform/` que crea los recursos básicos (Storage bucket, Firestore, KMS, Service Account) y un README con instrucciones para inicializar y aplicar.

## CI/CD

El repo incluye un workflow de GitHub Actions que construye la app (Ionic) y despliega a Firebase Hosting/Functions. Se requiere configurar los secretos `FIREBASE_SERVICE_ACCOUNT` (JSON) y `GCP_PROJECT_ID`.
