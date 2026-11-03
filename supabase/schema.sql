CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_id TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Desconhecido',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_usuario_data ON gastos(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

