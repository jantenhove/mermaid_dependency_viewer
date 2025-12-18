export const EXAMPLE_GRAPH = `graph TD
  mongo[(mongo)]
  otel[otel]
  rabbitmq[rabbitmq]
  assets[assets]

  inventory-service[inventory-service]
  reset-service[reset-service]
  shuttle-service[shuttle-service]
  workflow-service[workflow-service]
  tmissionmanagement-service[tmissionmanagement-service]
  mission-management[mission-management]

  StorageReservation[Tmhls.StorageReservation]
  StorageLayout[Tmhls.StorageLayout]
  Layout[Tmhls.Layout]
  LayoutAdapter[Tmhls.LayoutAdapter]
  LocationGroup[Tmhls.LocationGroup]

  %% StorageReservation dependencies
  StorageReservation --> mongo
  StorageReservation --> otel
  StorageReservation --> rabbitmq
  StorageReservation --> StorageLayout
  StorageReservation --> inventory-service

  %% StorageReservation dependents
  reset-service --> StorageReservation
  shuttle-service --> StorageReservation
  workflow-service --> StorageReservation

  %% StorageLayout dependencies
  StorageLayout --> mongo
  StorageLayout --> otel
  StorageLayout --> rabbitmq

  %% StorageLayout dependents
  workflow-service --> StorageLayout
  shuttle-service --> StorageLayout

  %% Layout dependencies
  Layout --> mongo
  Layout --> otel
  Layout --> rabbitmq

  %% Layout dependents
  tmissionmanagement-service --> Layout
  mission-management --> Layout
  workflow-service --> Layout

  %% LayoutAdapter dependencies
  LayoutAdapter --> otel
  LayoutAdapter --> rabbitmq
  LayoutAdapter --> assets

  %% LocationGroup dependencies
  LocationGroup --> mongo
  LocationGroup --> rabbitmq
  LocationGroup --> otel

  %% LocationGroup dependents
  workflow-service --> LocationGroup`;
