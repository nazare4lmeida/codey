import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StyleMatch from "@/components/codey/StyleMatch";

const props = [
  { prop: "background-color", label: "Cor de fundo", options: ["#2a9d8f", "#e76f51"], answer: "#2a9d8f" },
  { prop: "color", label: "Cor do texto", options: ["white", "black"], answer: "white" },
];

const setup = () => {
  const onAnswer = vi.fn();
  render(<StyleMatch element="button" label="Começar" selector=".botao" props={props} explanation="Explicação." disabled={false} onAnswer={onAnswer} />);
  return onAnswer;
};

describe("Estilize igual ao modelo", () => {
  it("só libera o botão de conferir depois de escolher todos os estilos", () => {
    setup();
    const conferir = screen.getByRole("button", { name: /conferir estilo/i });
    expect(conferir).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "#2a9d8f" }));
    expect(conferir).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "white" }));
    expect(conferir).toBeEnabled();
  });

  it("o elemento da criança muda na hora e o CSS aparece escrito", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "#e76f51" }));
    const seus = screen.getAllByText("Começar")[1]; // [0] = modelo, [1] = o seu
    expect(seus.style.backgroundColor).toBe("rgb(231, 111, 81)");
    expect(screen.getByLabelText("CSS que você está montando").textContent).toContain("background-color: #e76f51;");
  });

  it("acertar tudo dá resposta certa", () => {
    const onAnswer = setup();
    fireEvent.click(screen.getByRole("button", { name: "#2a9d8f" }));
    fireEvent.click(screen.getByRole("button", { name: "white" }));
    fireEvent.click(screen.getByRole("button", { name: /conferir estilo/i }));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.stringContaining("igualzinho"));
  });

  it("errar diz qual parte ainda está diferente (sem só dizer 'errado')", () => {
    const onAnswer = setup();
    fireEvent.click(screen.getByRole("button", { name: "#2a9d8f" }));
    fireEvent.click(screen.getByRole("button", { name: "black" }));
    fireEvent.click(screen.getByRole("button", { name: /conferir estilo/i }));
    expect(onAnswer).toHaveBeenCalledWith(false, expect.stringContaining("cor do texto ainda está diferente"));
  });

  it("marca a opção escolhida para leitores de tela", () => {
    setup();
    const b = screen.getByRole("button", { name: "white" });
    expect(b).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
  });
});
