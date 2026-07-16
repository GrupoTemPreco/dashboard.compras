import { addMonthsIso, formatMesCurto, toFirstOfMonthIso } from '../../utils/period';

export interface MesReferenciaOption {
  value: string;
  label: string;
}

/** Três opções: mês anterior, vigente e seguinte — a partir do mes_referencia_final da linha. */
export function buildMesReferenciaOptions(mesVigenteIso: string): MesReferenciaOption[] {
  const vigente = toFirstOfMonthIso(mesVigenteIso);
  return [
    { value: addMonthsIso(vigente, -1), label: formatMesCurto(addMonthsIso(vigente, -1)) },
    { value: vigente, label: formatMesCurto(vigente) },
    { value: addMonthsIso(vigente, 1), label: formatMesCurto(addMonthsIso(vigente, 1)) },
  ];
}
