# frozen_string_literal: true

class Tree::Strategy::ComparePodd::DataAttributeSerializer < Tree::Strategy::DataAttributeSerializer

  def text
    object_decorated.jstree_compare_podd_text
  end

  # @todo - оптимизировать проверки на сравнение состояния (в модель)
  def type
    "attr_circle_#{@object.compare_podd_status.to_s}".to_sym
  end

end
