package com.store.demo.services;

import com.store.demo.dtos.UserDTO;
import com.store.demo.entities.User;
import com.store.demo.mappers.UserMapper;
import com.store.demo.repositories.UserRepository;
import com.store.demo.services.exceptions.DatabaseException;
import com.store.demo.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private UserMapper mapper;

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com o id: " + id));
    }

    @Transactional
    public User insert(UserDTO dto) {
        Optional<User> existingUser = repository.findByEmail(dto.getEmail());
        if (existingUser.isPresent()) {
            throw new DatabaseException("Já existe um cliente cadastrado com este e-mail: " + dto.getEmail());
        }

        User entity = mapper.toEntity(dto);
        return repository.save(entity);
    }

    @Transactional
    public User update(Long id, UserDTO dto) {
        try {
            User entity = repository.getReferenceById(id);

            Optional<User> existingUser = repository.findByEmail(dto.getEmail());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                throw new DatabaseException("Este e-mail já está sendo utilizado por outro cliente: " + dto.getEmail());
            }

            mapper.updateEntityFromDTO(dto, entity);
            return repository.save(entity);
        } catch (EntityNotFoundException e) {
            throw new ResourceNotFoundException("Cliente não encontrado com o id: " + id);
        }
    }

    @Transactional
    public void delete(Long id) {
        User entity = findById(id);

        if (!entity.getOrders().isEmpty()) {
            throw new DatabaseException("Não é permitido deletar o cliente pois existem pedidos associados a ele.");
        }

        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Falha de integridade referencial ao deletar cliente.");
        }
    }
}