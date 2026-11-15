package com.store.demo.services;

import java.util.List;

import com.store.demo.dtos.CategoryDTO;
import com.store.demo.entities.Category;
import com.store.demo.mappers.CategoryMapper;
import com.store.demo.repositories.CategoryRepository;
import com.store.demo.services.exceptions.DatabaseException;
import com.store.demo.services.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repository;

    @Autowired
    private CategoryMapper mapper;

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Category findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada com o id: " + id));
    }

    @Transactional
    public Category insert(CategoryDTO dto) {
        Category entity = mapper.toEntity(dto);
        return repository.save(entity); // Salva e retorna a própria entidade com o ID gerado pelo banco
    }

    @Transactional
    public Category update(Long id, CategoryDTO dto) {
        Category entity = findById(id);

        mapper.updateEntityFromDTO(dto, entity);
        return repository.save(entity);
    }

    @Transactional
    public void delete(Long id) {
        Category entity = findById(id);

        if (!entity.getProducts().isEmpty()) {
            throw new DatabaseException("Não é permitido deletar a categoria pois existem produtos associados a ela.");
        }

        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Falha de integridade referencial ao deletar categoria.");
        }
    }
}