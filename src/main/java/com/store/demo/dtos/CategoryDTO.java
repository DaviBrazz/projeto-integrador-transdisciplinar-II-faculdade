package com.store.demo.dtos;

import jakarta.validation.constraints.NotBlank;

public record CategoryDTO(
        @NotBlank(message = "O nome da categoria não pode estar vazio")
        String name
) {}