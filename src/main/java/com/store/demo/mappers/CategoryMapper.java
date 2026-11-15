package com.store.demo.mappers;

import com.store.demo.dtos.CategoryDTO;
import com.store.demo.entities.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    // Converte o DTO de entrada para a Entidade do banco
    public Category toEntity(CategoryDTO dto) {
        Category entity = new Category();
        entity.setName(dto.name());
        return entity;
    }

    // Atualiza a entidade existente com os dados do DTO de entrada
    public void updateEntityFromDTO(CategoryDTO dto, Category entity) {
        entity.setName(dto.name());
    }
}