-- Agente local (recurso 400): links de cuadernos de NotebookLM que son
-- conocimiento de la gema guardada. Un link por linea. Viajan dentro del
-- bloque copiable para que el agente los conecte via MCP.
alter table user_gemas add column if not exists cuadernos text;
