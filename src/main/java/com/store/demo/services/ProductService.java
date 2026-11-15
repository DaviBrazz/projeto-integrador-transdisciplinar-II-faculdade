package com.store.demo.services;

import com.store.demo.dtos.ProductDTO;
import com.store.demo.entities.Product;
import com.store.demo.mappers.ProductMapper;
import com.store.demo.repositories.ProductRepository;
import com.store.demo.services.exceptions.DatabaseException;
import com.store.demo.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repository;

    @Autowired
    private ProductMapper mapper;

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Product findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com o id: " + id));
    }

    @Transactional
    public Product insert(ProductDTO dto) {
        Product entity = mapper.toEntity(dto);
        return repository.save(entity);
    }

    @Transactional
    public Product update(Long id, ProductDTO dto) {
        try {
            Product entity = repository.getReferenceById(id);
            mapper.updateEntityFromDTO(dto, entity);
            return repository.save(entity);
        } catch (EntityNotFoundException e) {
            throw new ResourceNotFoundException("Produto não encontrado com o id: " + id);
        }
    }

    @Transactional
    public void delete(Long id) {
        Product entity = findById(id);

        // Regra: o produto só pode ser deletado se não estiver associado a nenhum pedido
        if (!entity.getItems().isEmpty()) {
            throw new DatabaseException("Não é permitido deletar o produto pois ele está associado a um ou mais pedidos.");
        }

        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Falha de integridade referencial ao deletar produto.");
        }
    }
}