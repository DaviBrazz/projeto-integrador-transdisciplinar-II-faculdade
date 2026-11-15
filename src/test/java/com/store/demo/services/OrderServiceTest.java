package com.store.demo.services;

import com.store.demo.dtos.OrderDTO;
import com.store.demo.entities.Order;
import com.store.demo.entities.Product;
import com.store.demo.entities.User;
import com.store.demo.entities.enums.OrderStatus;
import com.store.demo.mappers.OrderMapper;
import com.store.demo.repositories.OrderItemRepository;
import com.store.demo.repositories.OrderRepository;
import com.store.demo.repositories.ProductRepository;
import com.store.demo.repositories.UserRepository;
import com.store.demo.services.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderMapper orderMapper;

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Product product;
    private Order order;
    private OrderDTO orderDTO;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        user = new User(1L, "Maria Silva", "maria@email.com", "21988888888");
        product = new Product(1L, "Livro Java", "Livro Spring Boot", 100.0, "url");
        order = new Order(1L, Instant.now(), OrderStatus.WAITING_PAYMENT, user);

        orderDTO = new OrderDTO(1L, List.of(new OrderDTO.OrderItemDTO(1L, 2)));
    }

    @Test
    void shouldReturnAllOrders() {
        Order o1 = new Order(1L, Instant.now(), OrderStatus.PAID, user);
        Order o2 = new Order(2L, Instant.now(), OrderStatus.WAITING_PAYMENT, user);

        when(orderRepository.findAll()).thenReturn(Arrays.asList(o1, o2));

        List<Order> result = orderService.findAll();

        assertEquals(2, result.size());
        verify(orderRepository, times(1)).findAll();
    }

    @Test
    void shouldReturnOrderById() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        Order result = orderService.findById(1L);

        assertNotNull(result);
        assertEquals(order, result);
        verify(orderRepository, times(1)).findById(1L);
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenOrderNotFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.findById(999L);
        });

        verify(orderRepository, times(1)).findById(999L);
    }

    @Test
    void shouldInsertOrderSuccessfully() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(productRepository.findAllById(anyList())).thenReturn(List.of(product));
        when(orderMapper.toEntity(any(OrderDTO.class), any(User.class), anyList())).thenReturn(order);
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        Order result = orderService.insert(orderDTO);

        assertNotNull(result);
        assertEquals(order, result);
        verify(userRepository, times(1)).findById(1L);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    void shouldThrowExceptionWhenClientNotFoundOnInsert() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.insert(orderDTO);
        });

        verify(userRepository, times(1)).findById(1L);
        verify(orderRepository, never()).save(any(Order.class));
    }
}