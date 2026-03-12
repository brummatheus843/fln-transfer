-- Seed agencies
insert into public.agencies (id, name, contact_name, email, phone, commission_pct) values
  ('a1000000-0000-0000-0000-000000000001', 'Agência Ilha Tour', 'Maria Silva', 'maria@ilhatour.com', '48999001234', 10),
  ('a1000000-0000-0000-0000-000000000002', 'CatarinaTur', 'João Souza', 'joao@catarinatur.com', '48999005678', 15);

-- Seed clients
insert into public.clients (id, name, email, phone, document, agency_id) values
  ('c1000000-0000-0000-0000-000000000001', 'Carlos Mendes', 'carlos@email.com', '48991110001', '123.456.789-00', 'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'Ana Pereira', 'ana@email.com', '48991110002', '987.654.321-00', null),
  ('c1000000-0000-0000-0000-000000000003', 'John Smith', 'john@email.com', '48991110003', null, 'a1000000-0000-0000-0000-000000000002');

-- Seed drivers
insert into public.drivers (id, full_name, phone, license_plate, vehicle_model, pix_key, active) values
  ('d1000000-0000-0000-0000-000000000001', 'Roberto Lima', '48992220001', 'ABC-1234', 'Toyota Corolla 2023', 'roberto@pix.com', true),
  ('d1000000-0000-0000-0000-000000000002', 'Fernanda Costa', '48992220002', 'DEF-5678', 'Chevrolet Spin 2024', '48992220002', true);

-- Seed rides
insert into public.rides (client_id, driver_id, agency_id, origin, destination, scheduled_at, pax_count, price, currency, status) values
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Aeroporto Hercílio Luz', 'Hotel Majestic Canasvieiras', now() + interval '2 hours', 3, 180.00, 'BRL', 'scheduled'),
  ('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', null, 'Hotel Castelmar Centro', 'Praia do Campeche', now() + interval '1 day', 2, 120.00, 'BRL', 'scheduled'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Jurerê Internacional', 'Aeroporto Hercílio Luz', now() - interval '1 day', 4, 65.00, 'USD', 'completed');
