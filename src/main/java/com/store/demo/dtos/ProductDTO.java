package com.store.demo.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class ProductDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "O nome do produto não pode estar vazio")
    private String name;

    private String descriptionString;

    @NotNull(message = "O preço é obrigatório")
    @Positive(message = "O preço deve ser positivo")
    private Double price;

    private String imgUrl;

    // Proteção contra nulos caso o front não envie o campo
    private List<Long> categoryIds = new ArrayList<>();

    public ProductDTO() {
    }

    public ProductDTO(String name, String descriptionString, Double price, String imgUrl, List<Long> categoryIds) {
        this.name = name;
        this.descriptionString = descriptionString;
        this.price = price;
        this.imgUrl = imgUrl;
        if (categoryIds != null) {
            this.categoryIds = categoryIds;
        }
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescriptionString() {
        return descriptionString;
    }

    public void setDescriptionString(String descriptionString) {
        this.descriptionString = descriptionString;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getImgUrl() {
        return imgUrl;
    }

    public void setImgUrl(String imgUrl) {
        this.imgUrl = imgUrl;
    }

    public List<Long> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(List<Long> categoryIds) {
        this.categoryIds = categoryIds != null ? categoryIds : new ArrayList<>();
    }
}