"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSpeedTest } from "./useSpeedTest";
import { ESTADO_INICIAL, diagnosticoReducer } from "@/lib/diagnosticoJornada";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import type { MeasurementSessionContext } from "@/lib/measurementSessionContext";
import { createWebDiagnosticResponse } from "@/lib/webDiagnosticResponse";
import { readLastCompleteResult, writeLastCompleteResult } from "@/lib/lastResultSession";

export function useDiagnosticoJornada() {
  const [estado, dispatch] = useReducer(diagnosticoReducer, ESTADO_INICIAL);
  const [diagnosticoEntrada, setDiagnosticoEntrada] = useState<{
    context: MeasurementSessionContext;
    respostas: ContextualAnswer[];
  } | null>(null);
  const motor = useSpeedTest("rapido");
  const jaIniciou = useRef(false);

  useEffect(() => {
    if (jaIniciou.current) return;
    jaIniciou.current = true;

    const resultadoAnterior = readLastCompleteResult();
    if (resultadoAnterior) {
      motor.injectResult(resultadoAnterior);
      if (resultadoAnterior.mode !== "rapido") {
        dispatch({ tipo: "teste_completo_pronto", temDiagnostico: false });
      }
      return;
    }

    motor.forceStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (motor.result?.status === "complete") writeLastCompleteResult(motor.result);
  }, [motor.result]);

  useEffect(() => {
    if (estado.nome === "inicio_automatico" && motor.result?.mode === "rapido") {
      dispatch({ tipo: "resultado_rapido_pronto" });
    }
  }, [estado.nome, motor.result]);

  useEffect(() => {
    if (estado.nome === "teste_completo" && motor.result?.mode === "completo") {
      dispatch({ tipo: "teste_completo_pronto", temDiagnostico: Boolean(diagnosticoEntrada?.respostas.length) });
    }
  }, [diagnosticoEntrada, estado.nome, motor.result]);

  const diagnostico = useMemo(() => {
    if (estado.nome !== "resultado_completo" || !estado.temDiagnostico || !motor.result || !diagnosticoEntrada) return null;
    return createWebDiagnosticResponse(motor.result, diagnosticoEntrada.context, diagnosticoEntrada.respostas);
  }, [diagnosticoEntrada, estado.nome, estado.temDiagnostico, motor.result]);

  function iniciarTesteCompleto(context: MeasurementSessionContext, respostas: ContextualAnswer[]) {
    setDiagnosticoEntrada({ context, respostas });
    dispatch({ tipo: "iniciar_teste_completo" });
    motor.forceStart(context, "completo");
  }

  function reiniciar() {
    dispatch({ tipo: "reiniciar" });
    jaIniciou.current = false;
    setDiagnosticoEntrada(null);
    motor.goToIdle();
  }

  return { estado, motor, diagnostico, iniciarTesteCompleto, reiniciar };
}

export type DiagnosticoJornada = ReturnType<typeof useDiagnosticoJornada>;
