-- CareSense Synthetic Clinical Seed Data
-- 5 Default Simulation Patients for Sepsis Risk Modeling

-- Model Version
INSERT INTO public.model_versions (id, model_name, version, status, metrics, metadata)
VALUES (
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    'CareSense Sepsis Risk Model',
    'v1.0.0',
    'Ready',
    '{"auroc": 0.884, "auprc": 0.742, "sensitivity": 0.86, "specificity": 0.83, "avg_latency_ms": 42}'::jsonb,
    '{"framework": "LightGBM + Temporal LSTM Ensemble", "horizon_hours": 6, "features_count": 34, "calibration": "Isotonic"}'::jsonb
) ON CONFLICT (version) DO NOTHING;

-- 5 Default Simulation Patients
-- Patient 1: P-1042 (Critical - Septic Shock Trajectory)
-- Patient 2: P-1024 (Elevated - Rapid Decompensation)
-- Patient 3: P-1018 (Watch - Borderline SIRS / Post-op)
-- Patient 4: P-1005 (Low - Stable Recovery)
-- Patient 5: P-1033 (Watch - Elderly Bacteremia Risk)

INSERT INTO public.patients (id, patient_code, age, gender, icu_bed, admission_time, status) VALUES
('b1111111-1111-1111-1111-111111111111', 'P-1042', 72, 'M', 'ICU-02', NOW() - INTERVAL '36 hours', 'ACTIVE'),
('b2222222-2222-2222-2222-222222222222', 'P-1024', 58, 'F', 'ICU-05', NOW() - INTERVAL '24 hours', 'ACTIVE'),
('b3333333-3333-3333-3333-333333333333', 'P-1018', 64, 'M', 'ICU-08', NOW() - INTERVAL '48 hours', 'ACTIVE'),
('b4444444-4444-4444-4444-444444444444', 'P-1005', 45, 'F', 'ICU-11', NOW() - INTERVAL '72 hours', 'ACTIVE'),
('b5555555-5555-5555-5555-555555555555', 'P-1033', 81, 'F', 'ICU-04', NOW() - INTERVAL '18 hours', 'ACTIVE')
ON CONFLICT (patient_code) DO NOTHING;

-- Simulation Patients reference
INSERT INTO public.simulation_patients (patient_id, is_default, trajectory_type, scenario_description) VALUES
('b1111111-1111-1111-1111-111111111111', TRUE, 'SEPTIC_SHOCK', 'Critical decompensation: High lactate (4.2), refractory hypotension (MAP 52), tachycardia (HR 121), elevated WBC.'),
('b2222222-2222-2222-2222-222222222222', TRUE, 'RAPID_DECOMPENSATION', 'Elevated early warning: Dropping SpO2 (91%), rising temp (38.8°C), respiratory tachypnea (Resp 27).'),
('b3333333-3333-3333-3333-333333333333', TRUE, 'BORDERLINE_WATCH', 'Watch tier: Post-op abdominal surgery, moderate leukocytosis, borderline tachycardia (HR 98).'),
('b4444444-4444-4444-4444-444444444444', TRUE, 'STABLE_RECOVERY', 'Low tier: Antibiotic treatment response, normalizing inflammatory markers, hemodynamically stable.'),
('b5555555-5555-5555-5555-555555555555', TRUE, 'ELDERLY_RISK', 'Watch tier: Frail elderly patient with urinary tract focus, fluctuating MAP and mild base deficit.')
ON CONFLICT DO NOTHING;
