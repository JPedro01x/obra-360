package br.com.obra360.application.usecase;

public final class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException() { super("Projeto não encontrado nesta empresa."); }
}
