# frozen_string_literal: true

class Tree::Strategy::ComparePodd::DataMartTableSerializer < Tree::Strategy::DataMartTableSerializer

  def text
    @object.tech_name.upcase
  end

  def load?
    @load ||= true
  end

  def opened?
    false
  end

  # @todo - оптимизировать проверки на сравнение состояния (в модель)
  def type
    "attr_circle_#{@object.compare_podd_status.to_s}".to_sym
  end

  protected

  def element_serializer
    Tree::Strategy::ComparePodd::DataAttributeSerializer
  end
end
