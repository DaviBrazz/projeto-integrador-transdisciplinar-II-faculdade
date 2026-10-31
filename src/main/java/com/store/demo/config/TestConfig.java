package com.store.demo.config;

import com.store.demo.entities.*;
import com.store.demo.entities.enums.OrderStatus;
import com.store.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;

@Configuration
@Profile("test")
public class TestConfig implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Override
    public void run(String... args) throws Exception {

        // 1. Criar e salvar Categorias
        Category cat1 = new Category(null, "Eletrônicos");
        Category cat2 = new Category(null, "Livros");
        Category cat3 = new Category(null, "Informática");
        Category cat4 = new Category(null, "Casa & Decoração");

        categoryRepository.saveAll(Arrays.asList(cat1, cat2, cat3, cat4));

        // 2. Criar e salvar Produtos (com os atributos da sua entity: name, descriptionString, price, imgUrl)
        Product p1 = new Product(null, "The Lord of the Rings", "Livro de fantasia épica de J.R.R. Tolkien.", 90.5, "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150");
        Product p2 = new Product(null, "Smart TV 55\" 4K", "Smart TV LED 55 polegadas Ultra HD 4K.", 2190.0, "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=150");
        Product p3 = new Product(null, "MacBook Pro 14\"", "Processador M2 Pro, 16GB RAM, 512GB SSD.", 12500.0, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150");
        Product p4 = new Product(null, "PC Gamer Core i7", "Intel Core i7, 16GB DDR4, RTX 3060 12GB.", 4200.0, "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=150");
        Product p5 = new Product(null, "Spring Boot & Java Guide", "Aprenda desenvolvimento Backend moderno.", 79.9, "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=150");

        // Associando categorias aos produtos
        p1.getCategories().add(cat2);
        p2.getCategories().add(cat1);
        p3.getCategories().add(cat1);
        p3.getCategories().add(cat3);
        p4.getCategories().add(cat3);
        p5.getCategories().add(cat2);

        productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));

        // 3. Criar e salvar Usuários / Clientes
        User u1 = new User(null, "Maria Brown", "maria@gmail.com", "988888888", "123456");
        User u2 = new User(null, "Alex Green", "alex@gmail.com", "977777777", "123456");
        User u3 = new User(null, "Bob Blue", "bob@gmail.com", "966666666", "123456");

        userRepository.saveAll(Arrays.asList(u1, u2, u3));

        // 4. Criar e salvar Pedidos (Orders)
        Order o1 = new Order(null, Instant.parse("2026-06-20T19:53:07Z"), OrderStatus.PAID, u1);
        Order o2 = new Order(null, Instant.parse("2026-07-21T03:42:10Z"), OrderStatus.WAITING_PAYMENT, u2);
        Order o3 = new Order(null, Instant.parse("2026-07-22T15:21:22Z"), OrderStatus.DELIVERED, u1);

        orderRepository.saveAll(Arrays.asList(o1, o2, o3));

        // 5. Criar e salvar Itens de Pedido (OrderItem) vinculados à chave composta
        OrderItem oi1 = new OrderItem(o1, p1, 2, 90.5);
        OrderItem oi2 = new OrderItem(o1, p3, 1, 12500.0);
        OrderItem oi3 = new OrderItem(o2, p2, 1, 2190.0);
        OrderItem oi4 = new OrderItem(o3, p5, 1, 79.9);

        orderItemRepository.saveAll(Arrays.asList(oi1, oi2, oi3, oi4));

        // 6. Criar Pagamento (@MapsId - O id do pagamento deve ser o mesmo do pedido)
        Payment pay1 = new Payment(o1.getId(), Instant.parse("2026-06-20T21:53:07Z"), o1);
        o1.setPayment(pay1);

        Payment pay3 = new Payment(o3.getId(), Instant.parse("2026-07-22T15:25:00Z"), o3);
        o3.setPayment(pay3);

        // Salvando os pedidos novamente para registrar os pagamentos vinculados
        orderRepository.saveAll(Arrays.asList(o1, o3));
    }
}