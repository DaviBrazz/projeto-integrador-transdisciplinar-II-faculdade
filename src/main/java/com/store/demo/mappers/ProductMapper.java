package com.store.demo.mappers;

import com.store.demo.dtos.ProductDTO;
import com.store.demo.entities.Category;
import com.store.demo.entities.Product;
import com.store.demo.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    @Autowired
    private CategoryRepository categoryRepository;

    public Product toEntity(ProductDTO dto) {
        Product entity = new Product();
        entity.setName(dto.getName());
        entity.setDescriptionString(dto.getDescriptionString());
        entity.setPrice(dto.getPrice());
        entity.setImgUrl(dto.getImgUrl());

        entity.getCategories().clear();
        if (dto.getCategoryIds() != null) {
            for (Long catId : dto.getCategoryIds()) {
                Category category = categoryRepository.findById(catId)
                        .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o id: " + catId));
                entity.getCategories().add(category);
            }
        }

        return entity;
    }

    public void updateEntityFromDTO(ProductDTO dto, Product entity) {
        entity.setName(dto.getName());
        entity.setDescriptionString(dto.getDescriptionString());
        entity.setPrice(dto.getPrice());
        entity.setImgUrl(dto.getImgUrl());

        entity.getCategories().clear();
        if (dto.getCategoryIds() != null) {
            for (Long catId : dto.getCategoryIds()) {
                Category category = categoryRepository.findById(catId)
                        .orElseThrow(() -> new RuntimeException("Categoria não encontrada com o id: " + catId));
                entity.getCategories().add(category);
            }
        }
    }
}