package com.tienda.inventario.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> notFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return response("not-found", "Recurso no encontrado", HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(BusinessConflictException.class)
    public ResponseEntity<ProblemDetail> conflict(BusinessConflictException exception, HttpServletRequest request) {
        return response("business-conflict", "Conflicto de negocio", HttpStatus.CONFLICT, exception.getMessage(), request);
    }

    @ExceptionHandler({InvalidRequestException.class, ConstraintViolationException.class})
    public ResponseEntity<ProblemDetail> badRequest(RuntimeException exception, HttpServletRequest request) {
        return response("invalid-request", "Solicitud invalida", HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> validation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        ProblemDetail problem = problem(
                "validation-error",
                "Error de validacion",
                HttpStatus.BAD_REQUEST,
                "Uno o mas campos no son validos",
                request
        );
        List<Map<String, String>> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of(
                        "pointer", "/" + error.getField(),
                        "code", error.getCode() == null ? "Invalid" : error.getCode(),
                        "detail", error.getDefaultMessage() == null ? "Valor invalido" : error.getDefaultMessage()
                ))
                .toList();
        problem.setProperty("errors", errors);
        return entity(problem);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> unreadable(HttpServletRequest request) {
        return response(
                "malformed-json",
                "Contenido invalido",
                HttpStatus.BAD_REQUEST,
                "El cuerpo JSON no puede ser interpretado",
                request
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> integrity(HttpServletRequest request) {
        return response(
                "data-conflict",
                "Conflicto de datos",
                HttpStatus.CONFLICT,
                "La operacion entra en conflicto con datos existentes",
                request
        );
    }

    private ResponseEntity<ProblemDetail> response(
            String type,
            String title,
            HttpStatus status,
            String detail,
            HttpServletRequest request
    ) {
        return entity(problem(type, title, status, detail, request));
    }

    private ProblemDetail problem(
            String type,
            String title,
            HttpStatus status,
            String detail,
            HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create("urn:stock-control:problem:" + type));
        problem.setTitle(title);
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    private ResponseEntity<ProblemDetail> entity(ProblemDetail problem) {
        return ResponseEntity.status(problem.getStatus())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }
}
